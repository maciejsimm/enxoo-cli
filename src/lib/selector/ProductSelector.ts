import { Connection } from "@salesforce/core";
import { Query } from "./Query";
import { Util } from "../Util";

export class ProductSelector {

    private settings:any;

    constructor(querySettings?:any) {
        this.settings = querySettings;
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
        const query = "SELECT " + queryBody + ", enxCPQ__Category__r.enxCPQ__TECH_External_Id__c \
                         FROM Product2 \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                          AND (RecordType.Name = 'Product' OR RecordType.Name = 'Bundle')";
        const products = await Query.executeQuery(connection, query, queryLabel);
        return products;
    }

    public async getProductOptions(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'productOption';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + ", enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c \
                         FROM Product2 \
                        WHERE enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Option'";
        const products = await Query.executeQuery(connection, query, queryLabel);
        return products;
    }

    public async getCharges(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'charge';
        const query = "SELECT Name, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c \
                         FROM Product2 \
                        WHERE enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c IN ('" + productIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Charge'";

        const charges = await Query.executeQuery(connection, query, queryLabel);
        return charges;
    }

    public async getAttributes(connection: Connection, productIds:Array<String>) {
        const queryLabel = 'productAttr';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + " , enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.DeveloperName \
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
        const query = "SELECT " + queryBody + " \
                         FROM Product2 \
                        WHERE enxCPQ__TECH_External_Id__c IN ('" + chargeIds.join('\',\'') + "')";
        const chargeDefinitions = await Query.executeQuery(connection, query, 'charge');
        return chargeDefinitions;
    }

    public async getChargeElements(connection: Connection, chargeIds:Array<String>) {
        const queryLabel = 'charge element';
        const query = "SELECT Name, enxCPQ__TECH_External_Id__c, enxCPQ__Dimension_1_Value__c, enxCPQ__Dimension_2_Value__c, enxCPQ__Dimension_3_Value__c, \
                              enxCPQ__Dimension_4_Value__c, enxCPQ__Dimension_5_Value__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c  \
                         FROM Product2 \
                        WHERE enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c IN ('" + chargeIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Charge Element'";
        const chargeElements = await Query.executeQuery(connection, query, queryLabel);
        return chargeElements;
    }

    public async getChargeTiers(connection: Connection, chargeIds:Array<String>) {
        const queryLabel = 'product';
        const queryBody = this.settings[queryLabel];
        if (queryBody === undefined) Util.throwError('Undefined query configuration for: ' + queryLabel);
        const query = "SELECT " + queryBody + ", enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c  \
                         FROM Product2 \
                        WHERE enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c IN ('" + chargeIds.join('\',\'') + "') \
                          AND RecordType.Name = 'Charge Tier'";
        const chargeElements = await Query.executeQuery(connection, query, 'charge tier');
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
    
}