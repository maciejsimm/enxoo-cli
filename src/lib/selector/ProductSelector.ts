import { Connection } from "@salesforce/core";
import { Query } from "./Query";
import { Schema } from "./Schema"

export class ProductSelector {

    private additionalFields: any;
    private fieldsToIgnore: any;
    private queryFields: any;
    private exportB2BObjects: boolean;
    private resourceRecordSFIDs: Array<any>;

    constructor(querySettings: any, queryFields: any, exportB2BObjects: boolean) {
        this.additionalFields = querySettings ? querySettings.customFields ? querySettings.customFields : [] : [];
        this.fieldsToIgnore = querySettings ? querySettings.fieldsToIgnore ? querySettings.fieldsToIgnore : [] : [];
        this.exportB2BObjects = exportB2BObjects;
        this.queryFields = queryFields? queryFields : [];
    }

    public async getRecordTypes(connection: Connection) {
        const queryLabel = 'recordTypes';
        const query = "SELECT Id, Name, DeveloperName, SObjectType \
                         FROM RecordType";

        const recordTypes = await Query.executeQuery(connection, query, queryLabel);

        return recordTypes.map((rt) => {
            return { Object: rt['SobjectType'], DeveloperName: rt['DeveloperName'], id: rt['Id'] };
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

        const result = [...relatedProductNames, ...bundleElementNames];

        return result;

    }

    public async getProducts(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'product';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.Product2), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + ", enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM Product2 \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                          AND (RecordType.Name = 'Product' OR RecordType.Name = 'Bundle')";
        const products = await Query.executeQuery(connection, query, queryLabel);
        return products;
    }

    public async getProductIds(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'Product Ids';
        const query = "SELECT Id, enxCPQ__TECH_External_Id__c \
                         FROM Product2 \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const products = await Query.executeQuery(connection, query, queryLabel, productIds.length);
        return products;
    }

    public async getProductOptions(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'productOption';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.Product2), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, 'product');
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + ", enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM Product2 \
                        WHERE enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Option' \
                     ORDER BY enxCPQ__TECH_External_Id__c";
        const products = await Query.executeQuery(connection, query, queryLabel);
        return products;
    }

    public async getResourceJunctionObjects(connection: Connection, productIds: Array<String>) {
        //todo: add the productResource to schema class
      try{
        const productResourcequery = "SELECT enxCPQ__Resource__r.enxCPQ__TECH_External_Id__c, enxCPQ__Criteria__c, enxCPQ__Applicable_Solution_Variants__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, enxCPQ__Product__c, enxCPQ__TECH_External_Id__c, enxCPQ__Resource__c \
                                        FROM enxCPQ__ProductResource__c\
                                       WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')\
                                          OR enxCPQ__Product__r.RecordType.name = 'option'";

        const productResources = await Query.executeQuery(connection, productResourcequery, 'productResource');
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

        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.Resource), ...queryInject];

        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e);
        }) : queryFields;

        const queryProductResources = "SELECT " + queryFieldsReduced.join(',') + " \
                                         FROM Product2 \
                                        WHERE Id IN ('" + this.resourceRecordSFIDs.join('\',\'') + "')";

        let resources = await Query.executeQuery(connection, queryProductResources, 'Resources');

        return resources;
    }

    public async getUnrelatedResources(connection: Connection) {
        const queryLabel = 'productResources';

        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.Resource), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, 'product');
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;

        const queryUnrelatedResources = "SELECT " + queryFieldsReduced.join(',') + " \
                                        FROM Product2 \
                                        WHERE enxCPQ__Record_Type_Name__c = 'Resource' \
                                        AND Id NOT IN ('" + this.resourceRecordSFIDs.join('\',\'') + "')";

        let resources = await Query.executeQuery(connection, queryUnrelatedResources, 'unrelated Resources');

        return resources;
    }

    public async getCharges(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'charge';
        const query = "SELECT Name, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Field__c, \
                              enxCPQ__Charge_Name__c, enxCPQ__Pricing_Method__c, enxCPQ__Charge_Model__c, enxCPQ__Charge_Type__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c, RecordType.DeveloperName, \
                              enxCPQ__Sorting_Order__c, IsActive, enxCPQ__Billing_Frequency__c, enxCPQ__Unit_of_Measure__c, enxCPQ__Charge_Criteria__c, enxCPQ__Charge_Item_Action__c, enxCPQ__Reference_Price_Field__c, \
                              enxCPQ__Dimension_1__c, enxCPQ__Dimension_2__c, enxCPQ__Dimension_3__c, enxCPQ__Dimension_4__c, enxCPQ__Dimension_5__c, \
                              enxCPQ__Dimension_1_Numeric__c, enxCPQ__Dimension_2_Numeric__c, enxCPQ__Dimension_3_Numeric__c, enxCPQ__Dimension_4_Numeric__c, enxCPQ__Dimension_5_Numeric__c \
                         FROM Product2 \
                        WHERE enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Charge' \
                     ORDER BY enxCPQ__Charge_Type__c, enxCPQ__Sorting_Order__c, enxCPQ__TECH_External_Id__c";

        const charges = await Query.executeQuery(connection, query, queryLabel);
        return charges;
    }

    public async getBundleElements(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'bundleElement';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.BundleElement), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__BundleElement__c \
                        WHERE enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Order__c";
        const elements = await Query.executeQuery(connection, query, queryLabel);
        return elements;
    }

    public async getBundleElementOptions(connection: Connection, bundleElementIds: Array<String>) {
        const queryLabel = 'bundleElementOption';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.BundleElementOption), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxCPQ__Bundle_Element__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__BundleElementOption__c \
                        WHERE enxCPQ__Bundle_Element__r.enxCPQ__TECH_External_Id__c IN ('" + bundleElementIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Bundle_Element__c, enxCPQ__Order__c";
        const elementOptions = await Query.executeQuery(connection, query, queryLabel);
        return elementOptions;
    }

    public async getProductAttributes(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'productAttr';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.ProductAttribute), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, \
                              enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Value_Attribute__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__ProductAttribute__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Order__c";
        const attributes = await Query.executeQuery(connection, query, queryLabel);
        return attributes;
    }

    public async getProductAttributeIds(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'productAttr ids';
        const query = "SELECT Id \
                         FROM enxCPQ__ProductAttribute__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const attributes = await Query.executeQuery(connection, query, queryLabel);
        return attributes;
    }

    public async getLocalAttributeValues(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'attrValues';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.AttributeValue), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeValue__c \
                        WHERE enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Order__c";
        const attributeValues = await Query.executeQuery(connection, query, 'Local ' + queryLabel, productIds.length);
        return attributeValues;
    }

    public async getAttributeRules(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'attrRules';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.AttributeRule), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM enxCPQ__AttributeRule__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Order__c";
        const attributeRules = await Query.executeQuery(connection, query, queryLabel);
        return attributeRules;
    }

    public async getProductRelationships(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'productRelationships';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.ProductRelationship), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Secondary_Product__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__ProductRelationship__c \
                        WHERE enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__TECH_External_Id__c";
        const productRelationship = await Query.executeQuery(connection, query, queryLabel);
        return productRelationship;
    }

    public async getAttributeDefaultValues(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'attrDefaultValues';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.AttributeDefaultValue), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) &&!incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeDefaultValue__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__TECH_External_Id__c";
        const attrDefaultValues = await Query.executeQuery(connection, query, queryLabel);
        return attrDefaultValues;
    }

    public async getAttributeValueDependencies(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'attrValueDependecy';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.AttributeValueDependency), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, \
                                                  enxCPQ__Master_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c, \
                                                  enxCPQ__Master_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Value__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeValueDependency__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Execution_Order__c, enxCPQ__TECH_Key__c, enxCPQ__TECH_External_Id__c";
        const attrValueDependecy = await Query.executeQuery(connection, query, queryLabel);
        return attrValueDependecy;
    }

    public async getProductProvisioningPlans(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'prvPlanAssignment';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.ProvisioningPlanAssignment), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxB2B__Product__r.enxCPQ__TECH_External_Id__c, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c \
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
        const planAssignments = await Query.executeQuery(connection, query, queryLabel);
        return planAssignments;
    }

    public async getProvisioningPlans(connection: Connection, planIds: Array<String>) {
        const queryLabel = 'prvPlan';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.ProvisioningPlan), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " \
                         FROM enxB2B__ProvisioningPlan__c \
                        WHERE enxB2B__TECH_External_Id__c IN ('" + planIds.join('\',\'') + "')";
        const plans = await Query.executeQuery(connection, query, queryLabel);
        return plans;
    }

    public async getProvisioningTaskAssignments(connection: Connection, planIds: Array<String>) {
        const queryLabel = 'prvTaskAssignment';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.ProvisioningTaskAssignment), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, enxB2B__Provisioning_Task__r.enxB2B__TECH_External_Id__c \
                         FROM enxB2B__ProvisioningTaskAssignment__c \
                        WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN ('" + planIds.join('\',\'') + "') \
                     ORDER BY enxB2B__Order__c";
        const taskAssignments = await Query.executeQuery(connection, query, queryLabel);
        return taskAssignments;
    }

    public async getProvisioningTaskAssignmentIds(connection: Connection, planIds: Array<String>) {
        const queryLabel = 'prvTaskAssignment ids';
        const query = "SELECT Id \
                         FROM enxB2B__ProvisioningTaskAssignment__c \
                        WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN ('" + planIds.join('\',\'') + "')";
        const taskAssignments = await Query.executeQuery(connection, query, queryLabel);
        return taskAssignments;
    }

    public async getProvisioningTasks(connection: Connection, taskIds: Array<String>) {
        const queryLabel = 'prvTask';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.ProvisioningTask), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + ", RecordType.DeveloperName \
                         FROM enxB2B__ProvisioningTask__c \
                        WHERE enxB2B__TECH_External_Id__c IN ('" + taskIds.join('\',\'') + "')";
        const tasks = await Query.executeQuery(connection, query, queryLabel);
        return tasks;
    }

    public async getAttributeDefinitions(connection: Connection, attributeIds: Array<String>) {
        const queryLabel = 'attr';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.Attribute), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " \
                         FROM enxCPQ__Attribute__c \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + attributeIds.join('\',\'') + "')";
        const attributes = await Query.executeQuery(connection, query, queryLabel, attributeIds.length);
        return attributes;
    }

    public async getGlobalAttributeValues(connection: Connection, attributeIds: Array<String>) {
        const queryLabel = 'attrValues';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.AttributeValue), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeValue__c \
                        WHERE enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN ('" + attributeIds.join('\',\'') + "') \
                          AND enxCPQ__Exclusive_for_Product__c = null \
                     ORDER BY enxCPQ__Order__c";
        const attributeValues = await Query.executeQuery(connection, query, 'Global ' + queryLabel, attributeIds.length);
        return attributeValues;
    }

    public async getAttributeSets(connection: Connection, attributeSetIds: Array<String>) {
        const queryLabel = 'attrSet';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.AttributeSet), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " \
                         FROM enxCPQ__AttributeSet__c \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + attributeSetIds.join('\',\'') + "')";
        const attributeSets = await Query.executeQuery(connection, query, queryLabel);
        return attributeSets;
    }

    public async getAttributeSetAttributes(connection: Connection, attributeSetIds: Array<String>) {
        const queryLabel = 'attrSetAttr';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.AttributeSetAttribute), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + ", enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeSetAttribute__c \
                        WHERE enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c IN ('" + attributeSetIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__Order__c";
        const attributeSetAttributes = await Query.executeQuery(connection, query, queryLabel);
        return attributeSetAttributes;
    }


    public async getChargeDefinitions(connection: Connection, chargeIds: Array<String>) {
        const queryLabel = 'product';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.Product2), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + ", enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, \
                                                 enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM Product2 \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + chargeIds.join('\',\'') + "')";
        const chargeDefinitions = await Query.executeQuery(connection, query, 'charge');
        return chargeDefinitions;
    }

    public async getChargeElements(connection: Connection, chargeIds: Array<String>) {
        const queryLabel = 'charge element';
        const query = "SELECT Name, enxCPQ__TECH_External_Id__c, enxCPQ__Dimension_1_Value__c, enxCPQ__Dimension_2_Value__c, enxCPQ__Dimension_3_Value__c, \
                              enxCPQ__Dimension_4_Value__c, enxCPQ__Dimension_5_Value__c, \
                              enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName  \
                         FROM Product2 \
                        WHERE enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c IN ('" + chargeIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Charge Element' \
                     ORDER BY enxCPQ__TECH_External_Id__c";
        const chargeElements = await Query.executeQuery(connection, query, queryLabel, chargeIds.length);
        return chargeElements;
    }

    public async getChargeTiers(connection: Connection, chargeIds: Array<String>) {
        const queryLabel = 'charge tier';
        const query = "SELECT Name, enxCPQ__TECH_External_Id__c, enxCPQ__Value_From__c, enxCPQ__Value_To__c, IsActive, \
                              enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName  \
                         FROM Product2 \
                        WHERE enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c IN ('" + chargeIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Charge Tier' \
                     ORDER BY enxCPQ__Value_From__c";
        const chargeElements = await Query.executeQuery(connection, query, queryLabel);
        return chargeElements;
    }

    public async getCategories(connection: Connection, categoryIds: Array<String>) {
        const queryLabel = 'category';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.Category), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + " , enxCPQ__Parameter_Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Category__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__Category__c \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + categoryIds.join('\',\'') + "')";
        const categories = await Query.executeQuery(connection, query, queryLabel);
        return categories;
    }

    public async getPricebooks(connection: Connection) {
        const queryLabel = 'pricebook';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.Pricebook), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + ", IsStandard \
                         FROM Pricebook2";
        const pricebooks = await Query.executeQuery(connection, query, queryLabel);
        return pricebooks;
    }

    public async getPricebookIds(connection: Connection) {
        const queryLabel = 'pricebook Ids';
        const query = "SELECT Id, enxCPQ__TECH_External_Id__c, IsStandard \
                         FROM Pricebook2";
        const pricebooks = await Query.executeQuery(connection, query, queryLabel);
        return pricebooks;
    }

    public async getStandardPricebookEntries(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'std pbe';
        const query = "SELECT UnitPrice, IsActive, UseStandardPrice, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode \
                         FROM PricebookEntry \
                         WHERE Product2.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                           AND Pricebook2.IsStandard = true \
                      ORDER BY CurrencyIsoCode, Product2Id, Id";
        const pricebookEntries = await Query.executeQuery(connection, query, queryLabel, productIds.length);
        return pricebookEntries;
    }

    public async getStandardPricebookEntryIds(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'std pbe ids';
        const query = "SELECT Id, Product2Id, Pricebook2Id, CurrencyIsoCode \
                         FROM PricebookEntry \
                         WHERE Product2.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                           AND Pricebook2.IsStandard = true";
        //    AND Pricebook2.IsActive = true";
        const pricebookEntries = await Query.executeQuery(connection, query, queryLabel, productIds.length);
        return pricebookEntries;
    }

    public async getPricebookEntries(connection: Connection, productIds: Array<String>, pricebookIds: Array<String>) {
        const queryLabel = 'pbe';
        const queryInject = this.additionalFields[queryLabel] || [];
        const queryFields = [...this.filterFields(Schema.PricebookEntry), ...queryInject];
        const incompatibleFields = this.filterIncompatibleFields(queryFields, queryLabel);
        const queryFieldsReduced = this.fieldsToIgnore[queryLabel] ? queryFields.filter(e => {
            return !this.fieldsToIgnore[queryLabel].includes(e) && !incompatibleFields.includes(e);
        }) : queryFields;
        const query = "SELECT " + queryFieldsReduced.join(',') + ", Product2.enxCPQ__TECH_External_Id__c, Pricebook2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode \
                         FROM PricebookEntry \
                         WHERE Product2.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                           AND Pricebook2.enxCPQ__TECH_External_Id__c IN ('" + pricebookIds.join('\',\'') + "') \
                           AND Pricebook2.IsStandard = false \
                      ORDER BY CurrencyIsoCode, Product2Id, Id";
        const pricebookEntries = await Query.executeQuery(connection, query, queryLabel, productIds.length);
        return pricebookEntries;
    }

    public async getPricebookEntryIds(connection: Connection, productIds: Array<String>) {
        const queryLabel = 'pbe ids';
        const query = "SELECT Id, Product2Id, Pricebook2Id, CurrencyIsoCode \
                         FROM PricebookEntry \
                         WHERE Product2.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                           AND Pricebook2.IsStandard = false";
        //AND Pricebook2.IsActive = true";
        const pricebookEntries = await Query.executeQuery(connection, query, queryLabel, productIds.length);
        return pricebookEntries;
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
          if(!this.queryFields[label].includes(field)){
            incompatibleFields.push(field);
          }
        });
      }
      return incompatibleFields;
    }
}
