import {Connection} from "@salesforce/core";
import {Query} from "./Query";
import {Schema} from "./Schema"
import {Utils} from "./Utils"

export class ProductSelector {

    private additionalFields: any;
    private fieldsToIgnore: any;
    private queryFields: any;
    private exportB2BObjects: boolean;
    private resourceRecordSFIDs: Array<any>;

    constructor(exportB2BObjects: boolean, querySettings: any = [], queryFields: any = []) {
        this.additionalFields = querySettings.customFields ? querySettings.customFields : [];
        this.fieldsToIgnore = querySettings.fieldsToIgnore ? querySettings.fieldsToIgnore : [];
        this.queryFields = queryFields;
        this.exportB2BObjects = exportB2BObjects;
    }

    public async getRecordTypes(connection: Connection) {
        const queryLabel = 'recordTypes';
        const query = "SELECT Id, Name, DeveloperName, SObjectType, NamespacePrefix \
                         FROM RecordType";

        const recordTypes = await Query.executeQuery(connection, query, queryLabel);

        return recordTypes.map((rt) => {
            return { Object: rt['SobjectType'], DeveloperName: rt['DeveloperName'], id: rt['Id'], NamespacePrefix: rt['NamespacePrefix'] };
        });
    }

    public getQueryFieldsReduced(queryLabel: string, schemaSetName: string, filterFieldsSource: string = null) {
      const queryInject = this.additionalFields[queryLabel] || [];
      const queryFields = [...this.filterFields(Schema[schemaSetName]), ...queryInject];
      const queryFieldsDeduplicated = Utils.deduplicateQueryFields(queryFields);
      const incompatibleFields = this.filterIncompatibleFields(queryFieldsDeduplicated, filterFieldsSource? filterFieldsSource : queryLabel);
      if (incompatibleFields.length) {
        console.warn('The following list of fields found in queryConfiguration.json file are incompatible with their description achieved from qryfields.json: ');
        console.table(incompatibleFields);
        console.log('HINT: When qryFields.JSON file is present in the system (after running the "enxoo:cpq:prd:describe" command), the content of "customFields" from queryConfiguration.JSON is being ignored')
      }
      return queryFieldsDeduplicated.filter(e => {
        return this.fieldsToIgnore[queryLabel]?!this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e) : !incompatibleFields.includes(e);
      });
    }

    public async getAllProducts(connection: Connection) {
        const queryLabel = 'all products';
        const query = "SELECT Id, enxCPQ__TECH_External_Id__c, Name \
                         FROM Product2 \
                        WHERE RecordType.Name = 'Product' \
                           OR RecordType.Name = 'Bundle'";

        const products = await Query.executeQuery(connection, query, queryLabel);

        return products.map((p) => {
            return { name: p['Name'], id: p['enxCPQ__TECH_External_Id__c'] };
        });
    }

    public async getAllRelatedProducts(connection: Connection, productIds: Array<String>) {

        const queryRelationships = "SELECT enxCPQ__Secondary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Secondary_Product__r.Name \
                                      FROM enxCPQ__ProductRelationship__c \
                                     WHERE enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                                       AND enxCPQ__Secondary_Product__c != null";

        const relatedProducts = await Query.executeQuery(connection, queryRelationships, 'Related Products');

        const relatedProductNames = relatedProducts.map((p) => {
            return { name: p['enxCPQ__Secondary_Product__r']['Name'], id: p['enxCPQ__Secondary_Product__r']['enxCPQ__TECH_External_Id__c'] };
        })

        const queryBundleElements = "SELECT enxCPQ__TECH_External_Id__c, (SELECT enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.Name, enxCPQ__Product__r.RecordType.Name, \
                                                                                 enxCPQ__Product__r.enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__Root_Product__r.Name \
                                                                            FROM enxCPQ__BundleElementOptions__r) \
                                      FROM enxCPQ__BundleElement__c \
                                     WHERE enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";

        const bundleElements = await Query.executeQuery(connection, queryBundleElements, 'Bundle Elements');

        let bundleElementNames = [];

        bundleElements.forEach((element) => {
            if (element['enxCPQ__BundleElementOptions__r'] !== undefined) {
                element['enxCPQ__BundleElementOptions__r']['records'].forEach((elementOption) => {
                    if (elementOption['enxCPQ__Product__r']['RecordType']['Name'] === 'Option') {
                        bundleElementNames.push({ name: elementOption['enxCPQ__Product__r']['enxCPQ__Root_Product__r']['Name'], id: elementOption['enxCPQ__Product__r']['enxCPQ__Root_Product__r']['enxCPQ__TECH_External_Id__c'] });
                    } else {
                        bundleElementNames.push({ name: elementOption['enxCPQ__Product__r']['Name'], id: elementOption['enxCPQ__Product__r']['enxCPQ__TECH_External_Id__c'] });
                    }
                });
            }
        });

      return [...relatedProductNames, ...bundleElementNames];

    }

    public async getProducts(connection: Connection, productIds: Array<String>) {
      const queryLabel = 'product';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel,'Product2').join(',') + ", enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM Product2 \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                          AND (RecordType.Name = 'Product' OR RecordType.Name = 'Bundle')";
        const products = await Query.executeQuery(connection, query, queryLabel);
        return products;
    }

    public async getProductIds(connection: Connection, productIds: Array<String>) {
      const queryLabel = 'Product Ids';
      const splittedProductIds = Utils.splitArrayForQueryBatches(this.getProductIdsQuery(productIds), productIds);
      const queries = [];
      splittedProductIds.forEach(productIdsBatch => {
        queries.push(this.getProductIdsQuery(productIdsBatch));
      });
      return await Query.executeQueries(connection, queries, queryLabel, productIds.length);
    }

    private getProductIdsQuery(productIds: Array<String>): string {
      return `
        SELECT 
          Id, enxCPQ__TECH_External_Id__c
        FROM Product2
        WHERE enxCPQ__TECH_External_Id__c IN ('${productIds.join("','")}')
      `;
    }

    public async getProductOptions(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'productOption';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'Product2', 'product').join(',') + ", enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM Product2 \
                        WHERE enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Option' \
                     ORDER BY enxCPQ__TECH_External_Id__c";
      return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getResourceJunctionObjects(connection: Connection, productIds: Array<String>) {
      try{
        const queryLabel = 'productResource';
        const productResourceQuery = "SELECT " + this.getQueryFieldsReduced('productRes', 'ProductResource', queryLabel).join(',') + ", enxCPQ__Resource__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c \
                                        FROM enxCPQ__ProductResource__c\
                                       WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')\
                                          OR enxCPQ__Product__r.RecordType.name = 'option'";

        const productResources = await Query.executeQuery(connection, productResourceQuery, queryLabel);
        return productResources;
      } catch (e){
        if(e.errorCode === 'INVALID_TYPE'){
          // if this falls it because of invalid type error it means, that we retrieve from package version less than 9 and we have to skip querying productResources
          console.log('-- Querying productResources omitted due to package version');
        } else {
          throw e;
        }
      }
    }

    public getResourceSFIDs(productResource: Array<any>) {
        let resourceRecordsSFIDs = new Set();

        productResource.forEach((element) => {
            resourceRecordsSFIDs.add(element.enxCPQ__Resource__c);
            if(element['enxCPQ__Resource__c']) {
                delete element['enxCPQ__Resource__c'];
            }
            if(element['enxCPQ__Product__c']) {
                delete element['enxCPQ__Product__c'];
            }
        });

        return Array.from(resourceRecordsSFIDs.values());
    }

    public async getProductsWithResourceRecordType(connection: Connection, productResource: Array<any>) {

        const queryLabel = 'productResources';

        this.resourceRecordSFIDs = this.getResourceSFIDs(productResource);

        const queryProductResources = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'Resource', 'product').join(',') + ", enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, RecordType.NamespacePrefix \
                                         FROM Product2 \
                                        WHERE Id IN ('" + this.resourceRecordSFIDs.join('\',\'') + "')";

      return await Query.executeQuery(connection, queryProductResources, 'Resources');
    }

    public async getUnrelatedResources(connection: Connection) {
        const queryLabel = 'productResources';

        const queryUnrelatedResources = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'Resource', 'product').join(',') + ", enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, RecordType.NamespacePrefix \
                                        FROM Product2 \
                                        WHERE enxCPQ__Record_Type_Name__c = 'Resource' \
                                        AND Id NOT IN ('" + this.resourceRecordSFIDs.join('\',\'') + "')";

        let resources = await Query.executeQuery(connection, queryUnrelatedResources, 'unrelated Resources');

        return resources;
    }

    public async getCharges(connection: Connection, productIds: Array<string>) {
      const queryLabel = 'charge';
      const splittedProductIds = Utils.splitArrayForQueryBatches(
        this.getChargesQuery(productIds, queryLabel),
        productIds
      );

      const queries = [];
      splittedProductIds.forEach(productIdsBatch => {
        queries.push(this.getChargesQuery(productIdsBatch, queryLabel));
      });
      
      return await Query.executeQueries(connection, queries, queryLabel, 50000);
    }

    private getChargesQuery(productIds: Array<string>, queryLabel: string): string {
      const fields = this.getQueryFieldsReduced(queryLabel, 'Charge', 'product').join(',');

      return `
        SELECT 
          ${fields}, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, 
          enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, 
          RecordType.DeveloperName 
        FROM Product2
        WHERE 
          (enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c IN ('${productIds.join("','")}')
          OR enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c IN ('${productIds.join("','")}'))
          AND RecordType.Name = 'Charge'
        ORDER BY 
          enxCPQ__Charge_Type__c, enxCPQ__Sorting_Order__c, enxCPQ__TECH_External_Id__c
      `;
    }

    public async getBundleElements(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'bundleElement';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'BundleElement').join(',') + " , enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__BundleElement__c \
                        WHERE enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Order__c";
      return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getBundleElementOptions(connection: Connection, bundleElementIds: Array<String>) {
        const queryLabel = 'bundleElementOption';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'BundleElementOption').join(',') + " , enxCPQ__Bundle_Element__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__BundleElementOption__c \
                        WHERE enxCPQ__Bundle_Element__r.enxCPQ__TECH_External_Id__c IN ('" + bundleElementIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Bundle_Element__c, enxCPQ__Order__c";
        return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getProductAttributes(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'productAttr';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'ProductAttribute').join(',') + " , enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, \
                              enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Value_Attribute__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__ProductAttribute__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Order__c";
        return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getProductAttributeIds(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'productAttr ids';
        const query = "SELECT Id \
                         FROM enxCPQ__ProductAttribute__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const attributes = await Query.executeQuery(connection, query, queryLabel);
        return attributes;
    }

    public async getLocalAttributeValues(connection: Connection, productIds: Array<string>) {
      const queryLabel = 'attrValues';
      const incompatibleExclusiveField = this.filterIncompatibleFields(['enxCPQ__Exclusive_for_Products__c'], queryLabel);
      const hasIncompatibleExcFields = incompatibleExclusiveField.length > 0;
      const fullQuery = this.getLocalAttributeValuesQuery(productIds, queryLabel, hasIncompatibleExcFields);
    
      const splittedProductIds = Utils.splitArrayForQueryBatches(fullQuery, productIds);
      const queries = [];
    
      splittedProductIds.forEach(productIdsBatch => {
        queries.push(this.getLocalAttributeValuesQuery(productIdsBatch, queryLabel, hasIncompatibleExcFields));
      });
    
      return await Query.executeQueries(connection, queries, 'Local ' + queryLabel, productIds.length);
    }
    
    private getLocalAttributeValuesQuery(productIds: Array<string>, queryLabel: string, hasIncompatibleExcFields: Boolean) {
      const fields = this.getQueryFieldsReduced(queryLabel, 'AttributeValue').join(',');
      return `
        SELECT 
          ${fields},  
          enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c
        FROM enxCPQ__AttributeValue__c
        WHERE ${hasIncompatibleExcFields ? 
          `enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c IN ('${productIds.join("','")}')` :
          `(enxCPQ__Exclusive_for_Products__c = null 
            AND enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c IN ('${productIds.join("','")}'))`
        }
        ORDER BY enxCPQ__Order__c
      `;
    }

    public async getAttributeRules(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'attrRules';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'AttributeRule').join(',') + " , enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM enxCPQ__AttributeRule__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Order__c";
        const attributeRules = await Query.executeQuery(connection, query, queryLabel);
        return attributeRules;
    }

    public async getProductRelationships(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'productRelationships';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'ProductRelationship').join(',') + " , enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Secondary_Product__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__ProductRelationship__c \
                        WHERE enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__TECH_External_Id__c";
        return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getAttributeDefaultValues(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'attrDefaultValues';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'AttributeDefaultValue').join(',') + " , enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeDefaultValue__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__TECH_External_Id__c";
      return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getAttributeValueDependencies(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'attrValueDependency';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'AttributeValueDependency').join(',') + " , enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, \
                                                  enxCPQ__Master_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c, \
                                                  enxCPQ__Master_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Value__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeValueDependency__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Execution_Order__c, enxCPQ__TECH_Key__c, enxCPQ__TECH_External_Id__c";
      return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getProductProvisioningPlans(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'prvPlanAssignment';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'ProvisioningPlanAssignment').join(',') + " , enxB2B__Product__r.enxCPQ__TECH_External_Id__c, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c \
                         FROM enxB2B__ProvisioningPlanAssignment__c \
                        WHERE enxB2B__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const planAssignments = await Query.executeQuery(connection, query, queryLabel);
        return planAssignments;
    }

    public async getProductProvisioningPlanIds(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'prvPlanAssignment ids';
        const query = "SELECT Id \
                         FROM enxB2B__ProvisioningPlanAssignment__c \
                        WHERE enxB2B__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxB2B__Order__c";
      return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getProvisioningPlans(connection: Connection, planIds: Array<String>) {
        const queryLabel = 'prvPlan';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'ProvisioningPlan').join(',') + " \
                         FROM enxB2B__ProvisioningPlan__c \
                        WHERE enxB2B__TECH_External_Id__c IN ('" + planIds.join('\',\'') + "')";
      return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getProvisioningTaskAssignments(connection: Connection, planIds: Array<String>) {
        const queryLabel = 'prvTaskAssignment';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'ProvisioningTaskAssignment').join(',') + " , enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, enxB2B__Provisioning_Task__r.enxB2B__TECH_External_Id__c \
                         FROM enxB2B__ProvisioningTaskAssignment__c \
                        WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN ('" + planIds.join('\',\'') + "') \
                     ORDER BY enxB2B__Order__c";
      return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getProvisioningTaskAssignmentIds(connection: Connection, planIds: Array<String>) {
        const queryLabel = 'prvTaskAssignment ids';
        const query = "SELECT Id \
                         FROM enxB2B__ProvisioningTaskAssignment__c \
                        WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN ('" + planIds.join('\',\'') + "')";
      return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getProvisioningTasks(connection: Connection, taskIds: Array<String>) {
        const queryLabel = 'prvTask';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'ProvisioningTask').join(',') + ", RecordType.DeveloperName \
                         FROM enxB2B__ProvisioningTask__c \
                        WHERE enxB2B__TECH_External_Id__c IN ('" + taskIds.join('\',\'') + "')";
        const tasks = await Query.executeQuery(connection, query, queryLabel);
        await this.setOwnerFieldOnProvisioningTask(connection, tasks);
        return tasks;
    }

    private async setOwnerFieldOnProvisioningTask(connection: Connection, tasks: Array<any>){
      const ownerIds = new Set();
      // @ts-ignore
      tasks.forEach(task => ownerIds.add(task.OwnerId));
      const userQuery = "SELECT Id, Email FROM User WHERE Id IN ('" + Array.from(ownerIds).join('\',\'') + "')";
      const queueQuery = "SELECT Id, Name FROM Group WHERE Type = 'Queue' AND Id IN ('" + Array.from(ownerIds).join('\',\'') + "')";
      const users = await Query.executeQuery(connection, userQuery, 'provisioning task user owner');
      const queues = await Query.executeQuery(connection, queueQuery, 'provisioning task queue owner');
      let usersMap = new Map();
      // @ts-ignore
      users.forEach(u => usersMap.set(u.Id, u.Email))
      let queuesMap = new Map();
      // @ts-ignore
      queues.forEach(q => queuesMap.set(q.Id, q.Name))
      for(let task of tasks){
        // @ts-ignore
        let email = usersMap.get(task.OwnerId);
        let name = queuesMap.get(task.OwnerId);
        if(email){
          // @ts-ignore
          task.OwnerEmail = email;
        } else if(name){
          // @ts-ignore
          task.OwnerQueue = name;
        }
      }
    }

    public async getPriceRules(connection: Connection, productIds?: Array<String>) {
      const queryLabel = 'priceRules';
      const baseQuery = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'PriceRule').join(',') + ", RecordType.Name, RecordType.DeveloperName, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c \
                        FROM enxCPQ__PriceRule__c";
      
      const whereClause = productIds && productIds.length > 0 
        ? " WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')"
        : "";
      
      const query = baseQuery + whereClause + " ORDER BY enxCPQ__TECH_External_Id__c";
      return await Query.executeQuery(connection, query, queryLabel);
    }

  public async getPriceRuleConditions(connection: Connection, priceRuleIds: Array<String>) {
    const queryLabel = 'priceRuleCondition';
    const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'PriceRuleCondition').join(',') + ", enxCPQ__Price_Rule__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c \
                     FROM enxCPQ__PriceRuleCondition__c \
                     WHERE enxCPQ__Price_Rule__r.enxCPQ__TECH_External_Id__c IN ('" + priceRuleIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__TECH_External_Id__c";
    return await Query.executeQuery(connection, query, queryLabel);
  }

  public async getPriceRuleActions(connection: Connection, priceRuleIds: Array<String>) {
    const queryLabel = 'priceRuleAction';
    const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'PriceRuleAction').join(',') + ", enxCPQ__Price_Rule__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c \
                     FROM enxCPQ__PriceRuleAction__c \
                     WHERE enxCPQ__Price_Rule__r.enxCPQ__TECH_External_Id__c IN ('" + priceRuleIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__TECH_External_Id__c";
    return await Query.executeQuery(connection, query, queryLabel);
  }

    public async getAttributeDefinitions(connection: Connection, attributeIds: Array<string>) {
      const queryLabel = 'attr';
      const splittedAttributeIds = Utils.splitArrayForQueryBatches(
        this.getAttributeDefinitionsQuery(attributeIds),
        attributeIds
      );

      const queries = [];
      splittedAttributeIds.forEach(attributeIdsBatch => {
        queries.push(this.getAttributeDefinitionsQuery(attributeIdsBatch));
      });
    
      return await Query.executeQueries(connection, queries, queryLabel, attributeIds.length);
    }
    
    private getAttributeDefinitionsQuery(attributeIds: Array<string>) {
      return `
        SELECT ${this.getQueryFieldsReduced('attr', 'Attribute').join(',')} 
        FROM enxCPQ__Attribute__c 
        WHERE enxCPQ__TECH_External_Id__c IN ('${attributeIds.join("','")}')
      `;
    }

    public async getGlobalAttributeValues(connection: Connection, attributeIds: Array<string>) {
      const queryLabel = 'attrValues';
    
      const incompatibleExclusiveField = this.filterIncompatibleFields(['enxCPQ__Exclusive_for_Products__c'], queryLabel);
      const hasIncompatibleExcFields = incompatibleExclusiveField.length > 0;
    
      const fullQuery = this.getGlobalAttributeValuesQuery(attributeIds, queryLabel, hasIncompatibleExcFields);
      const splittedAttributeIds = Utils.splitArrayForQueryBatches(fullQuery, attributeIds);    
      const queries = [];
    
      splittedAttributeIds.forEach(attributeIdsBatch => {
        queries.push(this.getGlobalAttributeValuesQuery(attributeIdsBatch, queryLabel, hasIncompatibleExcFields));
      });
    
      return await Query.executeQueries(connection, queries, 'Global ' + queryLabel, attributeIds.length);
    }
    
    private getGlobalAttributeValuesQuery(attributeIds: Array<string>, queryLabel: string, hasIncompatibleExcFields: boolean) {
      const whereClause = hasIncompatibleExcFields
        ? `enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN ('${attributeIds.join("','")}')
           AND enxCPQ__Exclusive_for_Product__c = null`
        : `enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN ('${attributeIds.join("','")}')
           AND (enxCPQ__Global__c = true OR enxCPQ__Exclusive_for_Products__c != null)`;
      
      const fields = this.getQueryFieldsReduced(queryLabel, 'AttributeValue').join(',');
      return `
        SELECT 
          ${fields}, enxCPQ__Exclusive_for_Product__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c
        FROM enxCPQ__AttributeValue__c
        WHERE ${whereClause}
        ORDER BY enxCPQ__Order__c
      `;
    }

    public async getAttributeSets(connection: Connection, attributeSetIds: Array<String>) {
        const queryLabel = 'attrSet';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'AttributeSet').join(',') + " \
                         FROM enxCPQ__AttributeSet__c \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + attributeSetIds.join('\',\'') + "')";
      return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getAttributeSetAttributes(connection: Connection, attributeSetIds: Array<String>) {
        const queryLabel = 'attrSetAttr';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'AttributeSetAttribute').join(',') + ", enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeSetAttribute__c \
                        WHERE enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c IN ('" + attributeSetIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Order__c";
      return await Query.executeQuery(connection, query, queryLabel);
    }


    public async getChargeDefinitions(connection: Connection, chargeIds: Array<String>) {
        const queryLabel = 'product';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'Product2').join(',') + ", enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, \
                                                 enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM Product2 \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + chargeIds.join('\',\'') + "')";
        return await Query.executeQuery(connection, query, 'charge');
    }

    public async getChargeElements(connection: Connection, chargeIds: Array<string>) {
      const queryLabel = 'charge element';
      const fullQuery = this.getChargeElementsQuery(chargeIds);
    
      const splittedChargeIds = Utils.splitArrayForQueryBatches(fullQuery, chargeIds);
      const queries = [];
      splittedChargeIds.forEach(chargeIdsBatch => {
        queries.push(this.getChargeElementsQuery(chargeIdsBatch));
      });
    
      return await Query.executeQueries(connection, queries, queryLabel, chargeIds.length);
    }
    
    private getChargeElementsQuery(chargeIds: Array<string>) {
      return `
        SELECT Name,
          enxCPQ__TECH_External_Id__c, enxCPQ__Dimension_1_Value__c, enxCPQ__Dimension_2_Value__c,
          enxCPQ__Dimension_3_Value__c, enxCPQ__Dimension_4_Value__c, enxCPQ__Dimension_5_Value__c,
          enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c,enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c,
          RecordType.DeveloperName
        FROM Product2
        WHERE enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c IN ('${chargeIds.join("','")}')
          AND RecordType.Name = 'Charge Element'
        ORDER BY enxCPQ__TECH_External_Id__c
      `;
    }
    

    public async getChargeTiers(connection: Connection, chargeIds: Array<String>) {
        const queryLabel = 'charge tier';
        const query = "SELECT Name, enxCPQ__TECH_External_Id__c, enxCPQ__Value_From__c, enxCPQ__Value_To__c, IsActive, \
                              enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName  \
                         FROM Product2 \
                        WHERE enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c IN ('" + chargeIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Charge Tier' \
                     ORDER BY enxCPQ__Value_From__c";
      return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getCategories(connection: Connection, categoryIds: Array<String>) {
        const queryLabel = 'category';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'Category').join(',') + " , enxCPQ__Parameter_Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Category__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__Category__c \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + categoryIds.join('\',\'') + "')";
        return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getPricebooks(connection: Connection) {
        const queryLabel = 'pricebook';
        const query = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'Pricebook').join(',') + ", IsStandard FROM Pricebook2";
        return await Query.executeQuery(connection, query, queryLabel);
    }

    public async getPricebookIds(connection: Connection) {
        const queryLabel = 'pricebook Ids';
        const query = "SELECT Id, enxCPQ__TECH_External_Id__c, IsStandard \
                         FROM Pricebook2";
        return await Query.executeQuery(connection, query, queryLabel);
    }

      public async getStandardPricebookEntries(connection: Connection, productIds: Array<string>) {
        const queryLabel = 'std pbe';
        const fullQuery = this.getStandardPricebookEntriesQuery(productIds);

        const splittedProductIds = Utils.splitArrayForQueryBatches(fullQuery, productIds);
        const queries = [];
        splittedProductIds.forEach(productIdsBatch => {
          queries.push(this.getStandardPricebookEntriesQuery(productIdsBatch));
        });
      
        return await Query.executeQueries(connection, queries, queryLabel, productIds.length);
      }
      
      private getStandardPricebookEntriesQuery(productIds: Array<string>) {
        return `
          SELECT 
            UnitPrice, IsActive, UseStandardPrice, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode 
          FROM PricebookEntry 
          WHERE Product2.enxCPQ__TECH_External_Id__c IN ('${productIds.join("','")}')
            AND Pricebook2.IsStandard = true
          ORDER BY CurrencyIsoCode, Product2Id, Id
        `;
      }

    public async getStandardPricebookEntryIds(connection: Connection, productIds: Array<string>) {
      const queryLabel = 'std pbe ids';
      const fullQuery = this.getStandardPricebookEntryIdsQuery(productIds);
      const splittedProductIds = Utils.splitArrayForQueryBatches(fullQuery, productIds);
      const queries = [];
    
      splittedProductIds.forEach(productIdsBatch => {
        queries.push(this.getStandardPricebookEntryIdsQuery(productIdsBatch));
      });
    
      return await Query.executeQueries(connection, queries, queryLabel, productIds.length);
    }
    
    private getStandardPricebookEntryIdsQuery(productIds: Array<string>) {
      return `
        SELECT 
          Id, Product2Id, Pricebook2Id, CurrencyIsoCode
        FROM PricebookEntry
        WHERE Product2.enxCPQ__TECH_External_Id__c IN ('${productIds.join("','")}')
            AND Pricebook2.IsStandard = true
      `;
    }

    public async getPricebookEntries(connection: Connection, productIds: Array<string>, pricebookIds: Array<string>) {
      const queryLabel = 'pbe';
      const fullQuery = this.getPricebookEntriesQuery(productIds, pricebookIds, queryLabel);
      const splittedProductIds = Utils.splitArrayForQueryBatches(fullQuery, productIds);
      const queries = [];
    
      splittedProductIds.forEach(productIdsBatch => {
        queries.push(this.getPricebookEntriesQuery(productIdsBatch, pricebookIds, queryLabel));
      });
    
      return await Query.executeQueries(connection, queries, queryLabel, productIds.length);
    }
    
    private getPricebookEntriesQuery(productIds: Array<string>, pricebookIds: Array<string>, queryLabel: string) {
      const fields = this.getQueryFieldsReduced(queryLabel, 'PricebookEntry').join(',');
      return `
        SELECT 
          ${fields}, Product2.enxCPQ__TECH_External_Id__c, Pricebook2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode
        FROM PricebookEntry
        WHERE Product2.enxCPQ__TECH_External_Id__c IN ('${productIds.join("','")}')
          AND Pricebook2.enxCPQ__TECH_External_Id__c IN ('${pricebookIds.join("','")}')
          AND Pricebook2.IsStandard = false
        ORDER BY CurrencyIsoCode, Product2Id, Id
      `;
    }

    public async getPricebookEntryIds(connection: Connection, productIds: Array<string>) {
      const queryLabel = 'pbe ids';    
      const fullQuery = this.getPricebookEntryIdsQuery(productIds);
      const splittedProductIds = Utils.splitArrayForQueryBatches(fullQuery, productIds);
      const queries = [];    
      splittedProductIds.forEach(productIdsBatch => {
        queries.push(this.getPricebookEntryIdsQuery(productIdsBatch));
      });
    
      return await Query.executeQueries(connection, queries, queryLabel, productIds.length);
    }
    
    private getPricebookEntryIdsQuery(productIds: Array<string>) {
      return `
        SELECT 
          Id, Product2Id, Pricebook2Id, CurrencyIsoCode
        FROM PricebookEntry
        WHERE Product2.enxCPQ__TECH_External_Id__c IN ('${productIds.join("','")}')
          AND Pricebook2.IsStandard = false
      `;
    }
    private filterFields(fieldNames: Array<string>) {
        if (this.exportB2BObjects) {
            return fieldNames;
        } else {
            return fieldNames.filter(elem => { return !elem.includes('enxB2B') });
        }
    }

    private filterIncompatibleFields(queryFields: Array<String>, queryLabel: String){
      let incompatibleFields : Array<String> = [];
      let label = queryLabel + 'FieldNames';
      if(this.queryFields[label]){
        queryFields.forEach(field => {
          if(!this.queryFields[label].includes(field) && field != 'OwnerId'){
            incompatibleFields.push(field);
          }
        });
      }
      return incompatibleFields;
    }
}
