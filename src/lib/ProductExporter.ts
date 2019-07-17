// Class responsible for Extracting product data from an org

// ----- categories
// ----- products
// ----- productAttributes
// ----- attributeSets
// ----- attributeSetAttributes
// ----- attributes
// ----- attributeValues
// ----- attributeValueDependencies
// ----- attributeDefaultValues
// ----- attributeRules
// ----- productRelationships
// ----- provisioningPlanAssignments
// ----- provisioningPlans

// charges
// pricebooks
// stdPricebookEntries
// pricebookEntries
// provisioningTasks
// provisioningTaskAssignments
// priceRules
// priceRuleConditions
// priceRuleActions


import { Util } from './Util';
import { Connection } from '@salesforce/core';
import * as fs from 'fs';

export class ProductExporter {

    constructor(products: Array<String>) {
        if (products[0] === '*ALL') {
            this.productList = ['GEPL', 'IPLC', 'VPN']; // to-do -> query all products in the org and build the list
        } else {
            this.productList = products;
        }
    }

    private categoryIds:Set<String>;
    private attributeIds:Set<String>;
    private attributeSetIds:Set<String>;
    private provisioningPlanIds:Set<String>;
    private productList:Array<String>;

    public async all(conn: Connection) {            
        this.categoryIds = new Set<String>();
        this.attributeIds = new Set<String>();
        this.attributeSetIds = new Set<String>();
        this.provisioningPlanIds = new Set<String>();
        
        // let pricebookIds = [];
        // let priceRuleIds = [];

        for (let prodname of this.productList) {
            await this.retrieveProduct(conn, prodname);
        }

        await this.retrieveCategories(conn);
        await this.retrieveAttributes(conn);
        await this.retrieveAttributeSets(conn);
        await this.retrieveProvisioningPlans(conn);
    } 

    private async retrieveProduct(conn: Connection, productName: String) {
        Util.showSpinner(productName + ' export');

        let productDefinition = await ProductExporter.queryProduct(conn, productName);
        let options = await ProductExporter.queryProductOptions(conn, productName);
        let charges = await ProductExporter.queryProductCharges(conn, productName);
        let productAttributes = await ProductExporter.queryProductAttributes(conn, productName);
        let attributeValues = await ProductExporter.queryProductAttributeValues(conn, productName);
        let attributeDefaultValues = await ProductExporter.queryAttributeDefaultValues(conn, productName);
        let attributeValueDependencies = await ProductExporter.queryAttributeValueDependencies(conn, productName);
        let attributeRules = await ProductExporter.queryAttributeRules(conn, productName);
        let productRelationships = await ProductExporter.queryProductRelationships(conn, productName);
        let provisioningPlanAssings = await ProductExporter.queryProvisioningPlanAssigns(conn, productName);

        let product:any = {};
        product.root = productDefinition[0];
        product.options = options;
        product.charges = charges;
        product.productAttributes = productAttributes;
        product.attributeValues = attributeValues;
        product.attributeDefaultValues = attributeDefaultValues;
        product.attributeValueDependencies = attributeValueDependencies;
        product.attributeRules = attributeRules;
        product.productRelationships = productRelationships;
        product.provisioningPlanAssings = provisioningPlanAssings;

        this.extractIds(product);
        
        var dir = './temp/products';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        await fs.writeFile("./temp/products/" + productName + ".json", JSON.stringify(Util.sanitizeJSON(product), null, 3), function(err) {
            if(err) {
                return console.log(err);
            }
        });

        Util.hideSpinner(productName + ' export done'); 
    }

    private extractIds(product:any) {

        // Category IDs
        this.categoryIds.add(product.root.enxCPQ__Category__r.enxCPQ__TECH_External_Id__c);

        // Attribute & Attribute Set IDs
        if (product.productAttributes != null) {
            for (let attr of product.productAttributes) {
                this.attributeIds.add(attr.enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c);
                if (attr['enxCPQ__Attribute_Set__r'] != undefined) {
                    this.attributeSetIds.add(attr.enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c);
                }
            }
        }

        // Provisioning Plan IDs
        if (product.provisioningPlanAssings != null) {
            for (let assign of product.provisioningPlanAssings) {
                this.provisioningPlanIds.add(assign.enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c);
            }
        }
    }

    private async retrieveCategories(conn: Connection) {
        let categories = await ProductExporter.queryCategories(conn, this.categoryIds);
        
        var dir = './temp/categories';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let category of categories) {
            await fs.writeFile("./temp/categories/" + category['Name'] + ".json", JSON.stringify(Util.sanitizeJSON(category), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    private async retrieveAttributes(conn: Connection) {
        let attributes = await ProductExporter.queryAttributes(conn, this.attributeIds);
        let attributeValues = await ProductExporter.queryAttributeValues(conn, this.attributeIds);

        var dir = './temp/attributes';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let attribute of attributes) {
            let attributeToSave:any = {};
            attributeToSave.root = attribute;
            attributeToSave.values = new Array<any>();

            for (let attributeValue of attributeValues) {
                if (attributeValue['enxCPQ__Attribute__r']['enxCPQ__TECH_External_Id__c'] === attribute['enxCPQ__TECH_External_Id__c']) {
                    attributeToSave.values.push(attributeValue);
                }
            }

            await fs.writeFile("./temp/attributes/" + attribute['Name'] + ".json", JSON.stringify(Util.sanitizeJSON(attributeToSave), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    private async retrieveAttributeSets(conn: Connection) {
        let attributeSets = await ProductExporter.queryAttributeSets(conn, this.attributeSetIds);
        let attributeSetAttributes = await ProductExporter.queryAttributeSetAttributes(conn, this.attributeSetIds);
        
        var dir = './temp/attributeSets';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let attributeSet of attributeSets) {
            let attributeSetToSave:any = {};
            attributeSetToSave.root = attributeSet;
            attributeSetToSave.values = new Array<any>();

            for (let attributeSetAttribute of attributeSetAttributes) {
                if (attributeSetAttribute['enxCPQ__Attribute_Set__r']['enxCPQ__TECH_External_Id__c'] === attributeSet['enxCPQ__TECH_External_Id__c']) {
                    attributeSetToSave.values.push(attributeSetAttribute);
                }
            }

            await fs.writeFile("./temp/attributeSets/" + attributeSet['Name'] + ".json", JSON.stringify(Util.sanitizeJSON(attributeSetToSave), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    private async retrieveProvisioningPlans(conn: Connection) {
        let provisioningPlans = await ProductExporter.queryProvisioningPlans(conn, this.provisioningPlanIds);
        // let attributeSetAttributes = await ProductExporter.queryAttributeSetAttributes(conn, this.attributeSetIds);
        
        var dir = './temp/provisioningPlans';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let provisioningPlan of provisioningPlans) {
            let provisioningPlanToSave:any = {};
            provisioningPlanToSave.root = provisioningPlan;
        //     attributeSetToSave.values = new Array<any>();

        //     for (let attributeSetAttribute of attributeSetAttributes) {
        //         if (attributeSetAttribute['enxCPQ__Attribute_Set__r']['enxCPQ__TECH_External_Id__c'] === attributeSet['enxCPQ__TECH_External_Id__c']) {
        //             attributeSetToSave.values.push(attributeSetAttribute);
        //         }
        //     }

            await fs.writeFile("./temp/provisioningPlans/" + provisioningPlan['Name'] + ".json", JSON.stringify(Util.sanitizeJSON(provisioningPlanToSave), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    private static queryProduct(conn: Connection, productName: String): Promise<string> {
        Util.log('--- exporting product definition ');

        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, IsActive, enxCPQ__Billing_Frequency__c, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Criteria__c, enxCPQ__Charge_Item_Action__c, enxCPQ__Charge_Model__c, enxCPQ__Charge_Name__c, enxCPQ__Charge_Type__c, enxCPQ__Column_Dimension__c, enxCPQ__Column_Value__c, enxCPQ__Current_Inventory__c, enxCPQ__Current_Lead_Time__c, enxCPQ__Description_DE__c, enxCPQ__Description_EN__c, enxCPQ__Description_ES__c, enxCPQ__Description_FR__c, enxCPQ__Description_IT__c, enxCPQ__Description_Pattern__c, enxCPQ__Description_PL__c, enxCPQ__Hide_in_Product_Catalogue__c, enxCPQ__Ignore_Inventory_Management__c, enxCPQ__Ignore_Option_Requirement__c, enxCPQ__Pricing_Method__c, enxCPQ__Row_Dimension__c, enxCPQ__Row_Value__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Field__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, ProductCode, Description, Family, enxCPQ__Product_Lifecycle_Version__c,enxCPQ__TECH_Bundle_Element__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c,enxCPQ__TECH_Is_Configurable__c, enxCPQ__TECH_Option_JSON__c, enxCPQ__Unit_of_Measure__c, enxCPQ__Value_From__c, enxCPQ__Value_To__c,enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, enxCPQ__Save_Before_Calculation__c, RecordTypeId, enxCPQ__Dimension_1__c, enxCPQ__Dimension_1_Numeric__c, enxCPQ__Dimension_2__c, enxCPQ__Dimension_2_Numeric__c, enxCPQ__Dimension_3__c, enxCPQ__Dimension_3_Numeric__c, enxCPQ__Dimension_4__c, enxCPQ__Dimension_4_Numeric__c, enxCPQ__Dimension_5__c, enxCPQ__Dimension_5_Numeric__c FROM Product2 WHERE Name = '" + productName + "' LIMIT 1", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve product: ' + productName + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryProductOptions(conn: Connection, productName: String): Promise<string> {
        Util.log('--- exporting product options ');

        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, IsActive, enxCPQ__Billing_Frequency__c, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Criteria__c, enxCPQ__Charge_Item_Action__c, enxCPQ__Charge_Model__c, enxCPQ__Charge_Name__c, enxCPQ__Charge_Type__c, enxCPQ__Column_Dimension__c, enxCPQ__Column_Value__c, enxCPQ__Current_Inventory__c, enxCPQ__Current_Lead_Time__c, enxCPQ__Description_DE__c, enxCPQ__Description_EN__c, enxCPQ__Description_ES__c, enxCPQ__Description_FR__c, enxCPQ__Description_IT__c, enxCPQ__Description_Pattern__c, enxCPQ__Description_PL__c, enxCPQ__Hide_in_Product_Catalogue__c, enxCPQ__Ignore_Inventory_Management__c, enxCPQ__Ignore_Option_Requirement__c, enxCPQ__Pricing_Method__c, enxCPQ__Row_Dimension__c, enxCPQ__Row_Value__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Field__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, ProductCode, Description, Family, enxCPQ__Product_Lifecycle_Version__c,enxCPQ__TECH_Bundle_Element__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c,enxCPQ__TECH_Is_Configurable__c, enxCPQ__TECH_Option_JSON__c, enxCPQ__Unit_of_Measure__c, enxCPQ__Value_From__c, enxCPQ__Value_To__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, enxCPQ__Save_Before_Calculation__c, RecordTypeId, enxCPQ__Dimension_1__c, enxCPQ__Dimension_1_Numeric__c, enxCPQ__Dimension_2__c, enxCPQ__Dimension_2_Numeric__c, enxCPQ__Dimension_3__c, enxCPQ__Dimension_3_Numeric__c, enxCPQ__Dimension_4__c, enxCPQ__Dimension_4_Numeric__c, enxCPQ__Dimension_5__c, enxCPQ__Dimension_5_Numeric__c FROM Product2 WHERE RecordType.Name = 'Option' AND enxCPQ__Parent_Product__r.Name = '" + productName + "' ORDER BY enxCPQ__Sorting_Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve options: ' + productName + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryProductCharges(conn: Connection, productName: String): Promise<string> {
        Util.log('--- exporting product charges ');
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, IsActive, enxCPQ__Billing_Frequency__c, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Criteria__c, enxCPQ__Charge_Item_Action__c, enxCPQ__Charge_Model__c, enxCPQ__Charge_Name__c, enxCPQ__Charge_Type__c, enxCPQ__Column_Dimension__c, enxCPQ__Column_Value__c, enxCPQ__Current_Inventory__c, enxCPQ__Current_Lead_Time__c, enxCPQ__Description_DE__c, enxCPQ__Description_EN__c, enxCPQ__Description_ES__c, enxCPQ__Description_FR__c, enxCPQ__Description_IT__c, enxCPQ__Description_Pattern__c, enxCPQ__Description_PL__c, enxCPQ__Hide_in_Product_Catalogue__c, enxCPQ__Ignore_Inventory_Management__c, enxCPQ__Ignore_Option_Requirement__c, enxCPQ__Pricing_Method__c, enxCPQ__Row_Dimension__c, enxCPQ__Row_Value__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Field__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, ProductCode, Description, Family, enxCPQ__Product_Lifecycle_Version__c,enxCPQ__TECH_Bundle_Element__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c,enxCPQ__TECH_Is_Configurable__c, enxCPQ__TECH_Option_JSON__c, enxCPQ__Unit_of_Measure__c, enxCPQ__Value_From__c, enxCPQ__Value_To__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, enxCPQ__Save_Before_Calculation__c, RecordTypeId, enxCPQ__Dimension_1__c, enxCPQ__Dimension_1_Numeric__c, enxCPQ__Dimension_2__c, enxCPQ__Dimension_2_Numeric__c, enxCPQ__Dimension_3__c, enxCPQ__Dimension_3_Numeric__c, enxCPQ__Dimension_4__c, enxCPQ__Dimension_4_Numeric__c, enxCPQ__Dimension_5__c, enxCPQ__Dimension_5_Numeric__c FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__Root_Product__r.Name = '" + productName + "' ORDER BY enxCPQ__Sorting_Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve charges: ' + productName + '. Error: ' + err);
                console.log('fin charges');
                resolve(res.records);
            });
        });
    }

    private static queryProductAttributes(conn: Connection, productName: String): Promise<string> {
        Util.log('--- exporting product attributes ');
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxCPQ__Active__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Option_Affecting__c, enxCPQ__Order__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product_Field_to_Update__c, RecordTypeId, enxCPQ__Role__c, enxCPQ__TECH_External_Id__c, enxCPQ__Value_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Value_Boolean__c, enxCPQ__Value_Currency__c, enxCPQ__Value_Date__c, enxCPQ__Value_Number__c, enxCPQ__Value_Percent__c, enxCPQ__Value_Text_Long__c, enxCPQ__Value_Text_Short__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name = '" + productName + "' ORDER BY enxCPQ__Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve product attributes: ' + productName + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryProductAttributeValues(conn: Connection, productName: String): Promise<string> {
        Util.log('--- exporting product attribute values ');
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxCPQ__Active__c, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, enxCPQ__Order__c, enxCPQ__TECH_External_Id__c, enxCPQ__TECH_Definition_Id__c FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = false AND enxCPQ__Exclusive_for_Product__r.Name = '" + productName + "' ORDER BY enxCPQ__Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve product attribute values: ' + productName + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryAttributeValues(conn: Connection, attributeIds: Set<String>): Promise<string> {
        Util.log('--- exporting product attribute values ');
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxCPQ__Active__c, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, enxCPQ__Order__c, enxCPQ__TECH_External_Id__c, enxCPQ__TECH_Definition_Id__c FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = true AND enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeIds) + ") ORDER BY enxCPQ__Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve product attribute values: ' + attributeIds + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryAttributeDefaultValues(conn: Connection, productName: String): Promise<string> {
        Util.log('--- exporting attribute default values ');
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value_Text__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeDefaultValue__c WHERE enxCPQ__Product__r.Name = '" + productName + "' ORDER BY enxCPQ__TECH_External_Id__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve attribute default values: ' + productName + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryAttributeValueDependencies(conn: Connection, productName: String): Promise<string> {
        Util.log('--- exporting attribute value dependency ');
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Execution_Order__c, enxCPQ__Master_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c, enxCPQ__TECH_Key__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Product__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name = '" + productName + "' ORDER BY enxCPQ__TECH_External_Id__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve attribute value dependency: ' + productName + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryAttributeRules(conn: Connection, productName: String): Promise<string> {
        Util.log('--- exporting attribute rules ');
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT enxCPQ__Active__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Update_Logic__c, enxCPQ__Criteria__c, enxCPQ__Error_Message__c, enxCPQ__Order__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordTypeId, enxCPQ__Regexp__c, enxCPQ__Rule_Attribute_Update_Logic__c, enxCPQ__Rule_Criteria__c, enxCPQ__TECH_External_Id__c, enxCPQ__Validation_Type__c, enxCPQ__Value_From__c, enxCPQ__Value_To__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeRule__c WHERE enxCPQ__Product__r.Name = '" + productName + "' ORDER BY enxCPQ__Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve attribute rules: ' + productName + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryProductRelationships(conn: Connection, productName: String): Promise<string> {
        Util.log('--- exporting product relationships ');
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxCPQ__Max_Occurrences__c, enxCPQ__Min_Occurrences__c, enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Relationship_Type__c, enxCPQ__Secondary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name = '" + productName + "' AND enxCPQ__Secondary_Product__c != null", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve product relationships: ' + productName + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryProvisioningPlanAssigns(conn: Connection, productName: String): Promise<string> {
        Util.log('--- exporting provisioning plan assignments ');
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT enxB2B__Active__c, enxB2B__Criteria__c, enxB2B__Item_Action__c, enxB2B__Order__c, enxB2B__Product__r.enxCPQ__TECH_External_Id__c, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, enxB2B__TECH_External_ID__c FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.Name = '" + productName + "' ORDER BY enxB2B__Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve provisioning plan assignments: ' + productName + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryProvisioningPlans(conn: Connection, provisioningPlanIds: Set<String>): Promise<string> {
        Util.log('--- exporting provisioning plans ' + provisioningPlanIds.size);
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxB2B__Support_Plan__c, enxB2B__TECH_External_Id__c FROM enxB2B__ProvisioningPlan__c WHERE enxB2B__TECH_External_Id__c IN (" + Util.setToIdString(provisioningPlanIds) + ")",
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve provisioning plans: ' + provisioningPlanIds + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryCategories(conn: Connection, categoryIds: Set<String>): Promise<string> {
        Util.log('--- exporting categories - ' + categoryIds.size);
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c, enxCPQ__Parameter_Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Category__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__Category__c WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(categoryIds) + ") ", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve categories. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryAttributes(conn: Connection, attributeIds: Set<String>): Promise<string> {
        Util.log('--- exporting attributes - ' + attributeIds.size);
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxCPQ__Active__c, enxCPQ__Decimal_Places__c, enxCPQ__Description__c, enxCPQ__Description_DE__c, enxCPQ__Description_EN__c, enxCPQ__Description_ES__c, enxCPQ__Description_FR__c, enxCPQ__Description_IT__c, enxCPQ__Description_PL__c, enxCPQ__Display_Disabled__c,enxCPQ__Display_in_Configurator__c, enxCPQ__Display_not_for_Item_Action__c, enxCPQ__Display_not_for_Profile__c, enxCPQ__Display_not_on_Quote_Stage__c, enxCPQ__Display_on_Configuration_Description__c, enxCPQ__Editable_not_for_Item_Action__c, enxCPQ__Editable_not_for_Profile__c, enxCPQ__Editable_not_on_Quote_Stage__c, enxCPQ__Helptext__c, enxCPQ__Item_Field_Type__c, enxCPQ__Lookup_Field__c, enxCPQ__Lookup_Field_Query__c, enxCPQ__Lookup_Filters__c, enxCPQ__Lookup_Object__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, enxCPQ__Product_Field_to_Update__c, enxCPQ__Required__c, enxCPQ__Required_on_Quote_Stage__c, enxCPQ__Source_Field_Cart__c, enxCPQ__Source_Field__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__Type__c, enxCPQ__TECH_External_Id__c FROM enxCPQ__Attribute__c WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeIds) + ") ", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve attributes. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    private static queryAttributeSets(conn: Connection, attributeSetIds: Set<String>): Promise<string> {
        Util.log('--- exporting attributes sets - ' + attributeSetIds.size);
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxCPQ__Description__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeSet__c WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeSetIds) + ") ", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve attribute sets. Error: ' + err);
                resolve(res.records);
            });

        });
    }

    private static queryAttributeSetAttributes(conn: Connection, attributeSetIds: Set<String>): Promise<string> {
        Util.log('--- exporting attributes set attributes ');
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Order__c, enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeSetAttribute__c WHERE enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeSetIds) + ") ORDER BY enxCPQ__Order__c ", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve attribute set attributes. Error: ' + err);
                resolve(res.records);
            });

        });
    }
}