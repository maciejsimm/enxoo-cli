import { Connection } from "@salesforce/core";
import { Query } from "./Query";
import { Util } from "../Util";

export class ProductSelector {

    private settings:any;

    constructor(querySettings?:any) {
        this.settings = querySettings;
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

    public async getProducts(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'product';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + ", enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM Product2 \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                          AND (RecordType.Name = 'Product' OR RecordType.Name = 'Bundle')";
        const products = await Query.executeQuery(connection, query, queryLabel);
        return products;
    }

    public async getProductIds(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'product Ids';
        const query = "SELECT Id, enxCPQ__TECH_External_Id__c \
                         FROM Product2 \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const products = await Query.executeQuery(connection, query, queryLabel, productIds.length);
        return products;
    }

    public async getProductOptions(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'productOption';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + ", enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM Product2 \
                        WHERE enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Option'";
        const products = await Query.executeQuery(connection, query, queryLabel);
        return products;
    }

    public async getCharges(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'charge';
        const query = "SELECT Name, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, \
                              enxCPQ__Charge_Model__c, enxCPQ__Charge_Type__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM Product2 \
                        WHERE enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Charge'";

        const charges = await Query.executeQuery(connection, query, queryLabel);
        return charges;
    }

    public async getProductAttributes(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'productAttr';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " , enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM enxCPQ__ProductAttribute__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const attributes = await Query.executeQuery(connection, query, queryLabel);
        return attributes;
    }

    public async getProductAttributeIds(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'productAttr ids';
        const query = "SELECT Id \
                         FROM enxCPQ__ProductAttribute__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const attributes = await Query.executeQuery(connection, query, queryLabel);
        return attributes;
    }

    public async getLocalAttributeValues(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'attrValues';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " , enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeValue__c \
                        WHERE enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const attributeValues = await Query.executeQuery(connection, query, queryLabel);
        return attributeValues;
    }

    public async getAttributeRules(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'attrRules';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " , enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM enxCPQ__AttributeRule__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const attributeRules = await Query.executeQuery(connection, query, queryLabel);
        return attributeRules;
    }

    public async getProductRelationships(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'productRelationships';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " , enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Secondary_Product__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__ProductRelationship__c \
                        WHERE enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const productRelationship = await Query.executeQuery(connection, query, queryLabel);
        return productRelationship;
    }

    public async getAttributeDefaultValues(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'attrDefaultValues';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " , enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeDefaultValue__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const attrDefaultValues = await Query.executeQuery(connection, query, queryLabel);
        return attrDefaultValues;
    }

    public async getAttributeValueDependencies(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'attrValueDependecy';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " , enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Product__r.enxCPQ__TECH_External_Id__c, \
                                                  enxCPQ__Master_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c, \
                                                  enxCPQ__Master_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Value__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeValueDependency__c \
                        WHERE enxCPQ__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                     ORDER BY enxCPQ__TECH_Key__c";
        const attrValueDependecy = await Query.executeQuery(connection, query, queryLabel);
        return attrValueDependecy;
    }

    public async getProductProvisioningPlans(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'prvPlanAssignment';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " , enxB2B__Product__r.enxCPQ__TECH_External_Id__c, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c \
                         FROM enxB2B__ProvisioningPlanAssignment__c \
                        WHERE enxB2B__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const planAssignments = await Query.executeQuery(connection, query, queryLabel);
        return planAssignments;
    }

    public async getProductProvisioningPlanIds(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'prvPlanAssignment ids';
        const query = "SELECT Id \
                         FROM enxB2B__ProvisioningPlanAssignment__c \
                        WHERE enxB2B__Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "')";
        const planAssignments = await Query.executeQuery(connection, query, queryLabel);
        return planAssignments;
    }

    public async getProvisioningPlans(connection: Connection, planIds:Array<String>) {
        const queryLabel = 'prvPlan';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " \
                         FROM enxB2B__ProvisioningPlan__c \
                        WHERE enxB2B__TECH_External_Id__c IN ('" + planIds.join('\',\'') + "')";
        const plans = await Query.executeQuery(connection, query, queryLabel);
        return plans;
    }

    public async getProvisioningTaskAssignments(connection: Connection, planIds:Array<String>) {
        const queryLabel = 'prvTaskAssignment';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " , enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, enxB2B__Provisioning_Task__r.enxB2B__TECH_External_Id__c \
                         FROM enxB2B__ProvisioningTaskAssignment__c \
                        WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN ('" + planIds.join('\',\'') + "')";
        const taskAssignments = await Query.executeQuery(connection, query, queryLabel);
        return taskAssignments;
    }

    public async getProvisioningTaskAssignmentIds(connection: Connection, planIds:Array<String>) {
        const queryLabel = 'prvTaskAssignment ids';
        const query = "SELECT Id \
                         FROM enxB2B__ProvisioningTaskAssignment__c \
                        WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN ('" + planIds.join('\',\'') + "')";
        const taskAssignments = await Query.executeQuery(connection, query, queryLabel);
        return taskAssignments;
    }

    public async getProvisioningTasks(connection: Connection, taskIds:Array<String>) {
        const queryLabel = 'prvTask';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + ", RecordType.DeveloperName \
                         FROM enxB2B__ProvisioningTask__c \
                        WHERE enxB2B__TECH_External_Id__c IN ('" + taskIds.join('\',\'') + "')";
        const tasks = await Query.executeQuery(connection, query, queryLabel);
        return tasks;
    }

    public async getAttributeDefinitions(connection: Connection, attributeIds:Array<String>) {
        const queryLabel = 'attr';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " \
                         FROM enxCPQ__Attribute__c \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + attributeIds.join('\',\'') + "')";
        const attributes = await Query.executeQuery(connection, query, queryLabel);
        return attributes;
    }

    public async getGlobalAttributeValues(connection: Connection, attributeIds:Array<String>) {
        const queryLabel = 'attrValues';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " , enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeValue__c \
                        WHERE enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN ('" + attributeIds.join('\',\'') + "') \
                          AND enxCPQ__Exclusive_for_Product__c = null";
        const attributeValues = await Query.executeQuery(connection, query, queryLabel);
        return attributeValues;
    }

    public async getAttributeSets(connection: Connection, attributeSetIds:Array<String>) {
        const queryLabel = 'attrSet';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " \
                         FROM enxCPQ__AttributeSet__c \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + attributeSetIds.join('\',\'') + "')";
        const attributeSets = await Query.executeQuery(connection, query, queryLabel);
        return attributeSets;
    }

    public async getAttributeSetAttributes(connection: Connection, attributeSetIds:Array<String>) {
        const queryLabel = 'attrSetAttr';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + ", enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__AttributeSetAttribute__c \
                        WHERE enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c IN ('" + attributeSetIds.join('\',\'') + "')";
        const attributeSetAttributes = await Query.executeQuery(connection, query, queryLabel);
        return attributeSetAttributes;
    }

    
    public async getChargeDefinitions(connection: Connection, chargeIds:Array<String>) {
        const queryLabel = 'product';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + ", enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, \
                                                 enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
                         FROM Product2 \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + chargeIds.join('\',\'') + "')";
        const chargeDefinitions = await Query.executeQuery(connection, query, 'charge');
        return chargeDefinitions;
    }

    public async getChargeElements(connection: Connection, chargeIds:Array<String>) {
        const queryLabel = 'charge element';
        const query = "SELECT Name, enxCPQ__TECH_External_Id__c, enxCPQ__Dimension_1_Value__c, enxCPQ__Dimension_2_Value__c, enxCPQ__Dimension_3_Value__c, \
                              enxCPQ__Dimension_4_Value__c, enxCPQ__Dimension_5_Value__c, \
                              enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName  \
                         FROM Product2 \
                        WHERE enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c IN ('" + chargeIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Charge Element'";
        const chargeElements = await Query.executeQuery(connection, query, queryLabel);
        return chargeElements;
    }

    public async getChargeTiers(connection: Connection, chargeIds:Array<String>) {
        const queryLabel = 'charge tier';
        const query = "SELECT Name, enxCPQ__TECH_External_Id__c, enxCPQ__Value_From__c, enxCPQ__Value_To__c, \
                              enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName  \
                         FROM Product2 \
                        WHERE enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c IN ('" + chargeIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Charge Tier'";
        const chargeElements = await Query.executeQuery(connection, query, queryLabel);
        return chargeElements;
    }

    public async getCategories(connection: Connection, categoryIds:Array<String>) {
        const queryLabel = 'category';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " , enxCPQ__Parameter_Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Category__r.enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__Category__c \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + categoryIds.join('\',\'') + "')";
        const categories = await Query.executeQuery(connection, query, queryLabel);
        return categories;
    }

    public async getPricebooks(connection: Connection) {
        const queryLabel = 'pricebook';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + ", IsStandard \
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

    public async getStandardPricebookEntries(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'std pbe';
        const query = "SELECT UnitPrice, IsActive, UseStandardPrice, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode \
                         FROM PricebookEntry \
                         WHERE Product2.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                           AND Pricebook2.IsStandard = true \
                      ORDER BY CurrencyIsoCode, Product2Id, Id";
        const pricebookEntries = await Query.executeQuery(connection, query, queryLabel, productIds.length);
        return pricebookEntries;
    }

    public async getStandardPricebookEntryIds(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'std pbe ids';
        const query = "SELECT Id \
                         FROM PricebookEntry \
                         WHERE Product2.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                           AND Pricebook2.IsStandard = true";
        const pricebookEntries = await Query.executeQuery(connection, query, queryLabel, productIds.length);
        return pricebookEntries;
    }

    public async getPricebookEntries(connection: Connection, productIds:Array<String>, pricebookIds:Array<String>) {
        const queryLabel = 'pbe';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + ", Product2.enxCPQ__TECH_External_Id__c, Pricebook2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode \
                         FROM PricebookEntry \
                         WHERE Product2.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                           AND Pricebook2.enxCPQ__TECH_External_Id__c IN ('" + pricebookIds.join('\',\'') + "') \
                           AND Pricebook2.IsStandard = false \
                      ORDER BY CurrencyIsoCode, Product2Id, Id";
        const pricebookEntries = await Query.executeQuery(connection, query, queryLabel, productIds.length);
        return pricebookEntries;
    }

    public async getPricebookEntryIds(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'pbe ids';
        const query = "SELECT Id \
                         FROM PricebookEntry \
                         WHERE Product2.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                           AND Pricebook2.IsStandard = false";
        const pricebookEntries = await Query.executeQuery(connection, query, queryLabel, productIds.length);
        return pricebookEntries;
    }
    
}