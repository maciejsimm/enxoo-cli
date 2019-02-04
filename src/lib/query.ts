import { Connection } from "jsforce";
import * as fs from 'fs';

export module Queries {

    export function queryProduct(conn: Connection, productName: String) {
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, IsActive, enxCPQ__Billing_Frequency__c, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Criteria__c, enxCPQ__Charge_Item_Action__c, enxCPQ__Charge_Model__c, enxCPQ__Charge_Name__c, enxCPQ__Charge_Type__c, enxCPQ__Column_Dimension__c, enxCPQ__Column_Value__c, enxCPQ__Current_Inventory__c, enxCPQ__Current_Lead_Time__c, enxCPQ__Description_DE__c, enxCPQ__Description_EN__c, enxCPQ__Description_ES__c, enxCPQ__Description_FR__c, enxCPQ__Description_IT__c, enxCPQ__Description_Pattern__c, enxCPQ__Description_PL__c, enxCPQ__Hide_in_Product_Catalogue__c, enxCPQ__Ignore_Inventory_Management__c, enxCPQ__Ignore_Option_Requirement__c, enxCPQ__Pricing_Method__c, enxCPQ__Row_Dimension__c, enxCPQ__Row_Value__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Field__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, ProductCode, Description, Family, enxCPQ__Product_Lifecycle_Version__c,enxCPQ__TECH_Bundle_Element__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c,enxCPQ__TECH_Is_Configurable__c, enxCPQ__TECH_Option_JSON__c, enxCPQ__Unit_of_Measure__c, enxCPQ__Value_From__c, enxCPQ__Value_To__c,enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, enxCPQ__Save_Before_Calculation__c, RecordTypeId, enxCPQ__Dimension_1__c, enxCPQ__Dimension_1_Numeric__c, enxCPQ__Dimension_2__c, enxCPQ__Dimension_2_Numeric__c, enxCPQ__Dimension_3__c, enxCPQ__Dimension_3_Numeric__c, enxCPQ__Dimension_4__c, enxCPQ__Dimension_4_Numeric__c, enxCPQ__Dimension_5__c, enxCPQ__Dimension_5_Numeric__c FROM Product2 WHERE Name = '" + productName + "' LIMIT 1", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve product: ' + productName + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    export function queryProductAttributes(conn: Connection, productName: String) {
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxCPQ__Active__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Option_Affecting__c, enxCPQ__Order__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product_Field_to_Update__c, RecordTypeId, enxCPQ__Role__c, enxCPQ__TECH_External_Id__c, enxCPQ__Value_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Value_Boolean__c, enxCPQ__Value_Currency__c, enxCPQ__Value_Date__c, enxCPQ__Value_Number__c, enxCPQ__Value_Percent__c, enxCPQ__Value_Text_Long__c, enxCPQ__Value_Text_Short__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name = '" + productName + "' ORDER BY enxCPQ__Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve product attributes: ' + productName + '. Error: ' + err);
                resolve(res.records);
            });
        });
    }

    export function queryAttributeSets(conn: Connection) {
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxCPQ__Description__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeSet__c", 
            null,
            function (err, res) {
                if (err) reject('error retrieving attribute sets: ' + err);
                console.log("--- attributes sets " + res.records.length);

                fs.writeFile("./temp/products.json", JSON.stringify(res.records, null, 3), function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    console.log("----- charge elements file was saved");
                    resolve(res);
                }); 
            });
        });
    }

    export function queryAttributes(conn: Connection) {
        return new Promise<string>((resolve: Function, reject: Function) => {

            conn.query("SELECT Name, enxCPQ__Active__c, enxCPQ__Decimal_Places__c, enxCPQ__Description__c, enxCPQ__Description_DE__c, enxCPQ__Description_EN__c, enxCPQ__Description_ES__c, enxCPQ__Description_FR__c, enxCPQ__Description_IT__c, enxCPQ__Description_PL__c, enxCPQ__Display_Disabled__c,enxCPQ__Display_in_Configurator__c, enxCPQ__Display_not_for_Item_Action__c, enxCPQ__Display_not_for_Profile__c, enxCPQ__Display_not_on_Quote_Stage__c, enxCPQ__Display_on_Configuration_Description__c, enxCPQ__Editable_not_for_Item_Action__c, enxCPQ__Editable_not_for_Profile__c, enxCPQ__Editable_not_on_Quote_Stage__c, enxCPQ__Helptext__c, enxCPQ__Item_Field_Type__c, enxCPQ__Lookup_Field__c, enxCPQ__Lookup_Field_Query__c, enxCPQ__Lookup_Filters__c, enxCPQ__Lookup_Object__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, enxCPQ__Product_Field_to_Update__c, enxCPQ__Required__c, enxCPQ__Required_on_Quote_Stage__c, enxCPQ__Source_Field_Cart__c, enxCPQ__Source_Field__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__Type__c, enxCPQ__TECH_External_Id__c, Visible_On_Printout__c FROM enxCPQ__Attribute__c", 
            null,
            function (err, res) {
                if (err) reject('error retrieving attributes: ' + err);
                console.log("--- attributes: " + res.records.length);
                resolve(res);
            });
        });
    }

        // return new Promise<string>((resolve, reject) => {
        //     conn.query("SELECT Name, enxCPQ__Active__c, enxCPQ__Decimal_Places__c, enxCPQ__Description__c, enxCPQ__Description_DE__c, enxCPQ__Description_EN__c, enxCPQ__Description_ES__c, enxCPQ__Description_FR__c, enxCPQ__Description_IT__c, enxCPQ__Description_PL__c, enxCPQ__Display_Disabled__c,enxCPQ__Display_in_Configurator__c, enxCPQ__Display_not_for_Item_Action__c, enxCPQ__Display_not_for_Profile__c, enxCPQ__Display_not_on_Quote_Stage__c, enxCPQ__Display_on_Configuration_Description__c, enxCPQ__Editable_not_for_Item_Action__c, enxCPQ__Editable_not_for_Profile__c, enxCPQ__Editable_not_on_Quote_Stage__c, enxCPQ__Helptext__c, enxCPQ__Item_Field_Type__c, enxCPQ__Lookup_Field__c, enxCPQ__Lookup_Field_Query__c, enxCPQ__Lookup_Filters__c, enxCPQ__Lookup_Object__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, enxCPQ__Product_Field_to_Update__c, enxCPQ__Required__c, enxCPQ__Required_on_Quote_Stage__c, enxCPQ__Source_Field_Cart__c, enxCPQ__Source_Field__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__Type__c, enxCPQ__TECH_External_Id__c, Visible_On_Printout__c FROM enxCPQ__Attribute__c", function(err: Object, res: Object) {
        //         if (err) reject('error retrieving attributes: ' + err);
        //         console.log("--- attributes: " + res.records.length);
        //         resolve(res.records);
        //     });
        // });
    
}


// var jsforce = require('jsforce');
// var fs = require('fs');

// module.exports = {

//     queryRecordTypes: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Id, Name, DeveloperName, SObjectType FROM RecordType", function(err, res) {
//             if (err) reject('error retrieving record types: ' + err);
//             console.log("--- record types: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryAttributeSets: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, enxCPQ__Description__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeSet__c", function(err, res) {
//             if (err) reject('error retrieving attribute sets: ' + err);
//             console.log("--- attribute sets: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryAttributeSetAttributes: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Order__c, enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeSetAttribute__c", function(err, res) {
//             if (err) reject('error retrieving attribute set attributes: ' + err);
//             console.log("--- attribute set attributes: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryCategories: (conn) => new Promise((resolve, reject) => {
//         // missing -> enxCPQ__Default_Image__r.enxCPQ__TECH_External_Id__c 
//         conn.query("SELECT Name, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c, enxCPQ__Parameter_Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Category__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__Category__c", function(err, res) {
//             if (err) reject('error retrieving categories: ' + err);
//             console.log("--- categories: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryAttributes: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, enxCPQ__Active__c, enxCPQ__Decimal_Places__c, enxCPQ__Description__c, enxCPQ__Description_DE__c, enxCPQ__Description_EN__c, enxCPQ__Description_ES__c, enxCPQ__Description_FR__c, enxCPQ__Description_IT__c, enxCPQ__Description_PL__c, enxCPQ__Display_Disabled__c,enxCPQ__Display_in_Configurator__c, enxCPQ__Display_not_for_Item_Action__c, enxCPQ__Display_not_for_Profile__c, enxCPQ__Display_not_on_Quote_Stage__c, enxCPQ__Display_on_Configuration_Description__c, enxCPQ__Editable_not_for_Item_Action__c, enxCPQ__Editable_not_for_Profile__c, enxCPQ__Editable_not_on_Quote_Stage__c, enxCPQ__Helptext__c, enxCPQ__Item_Field_Type__c, enxCPQ__Lookup_Field__c, enxCPQ__Lookup_Field_Query__c, enxCPQ__Lookup_Filters__c, enxCPQ__Lookup_Object__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, enxCPQ__Product_Field_to_Update__c, enxCPQ__Required__c, enxCPQ__Required_on_Quote_Stage__c, enxCPQ__Source_Field_Cart__c, enxCPQ__Source_Field__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__Type__c, enxCPQ__TECH_External_Id__c, Visible_On_Printout__c FROM enxCPQ__Attribute__c", function(err, res) {
//             if (err) reject('error retrieving attributes: ' + err);
//             console.log("--- attributes: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryProducts: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, IsActive, enxCPQ__Billing_Frequency__c, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Criteria__c, enxCPQ__Charge_Item_Action__c, enxCPQ__Charge_Model__c, enxCPQ__Charge_Name__c, enxCPQ__Charge_Type__c, enxCPQ__Column_Dimension__c, enxCPQ__Column_Value__c, enxCPQ__Current_Inventory__c, enxCPQ__Current_Lead_Time__c, enxCPQ__Description_DE__c, enxCPQ__Description_EN__c, enxCPQ__Description_ES__c, enxCPQ__Description_FR__c, enxCPQ__Description_IT__c, enxCPQ__Description_Pattern__c, enxCPQ__Description_PL__c, enxCPQ__Hide_in_Product_Catalogue__c, enxCPQ__Ignore_Inventory_Management__c, enxCPQ__Ignore_Option_Requirement__c, enxCPQ__Pricing_Method__c, enxCPQ__Row_Dimension__c, enxCPQ__Row_Value__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Field__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, ProductCode, Description, Family, enxCPQ__Product_Lifecycle_Version__c,enxCPQ__TECH_Bundle_Element__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c,enxCPQ__TECH_Is_Configurable__c, enxCPQ__TECH_Option_JSON__c, enxCPQ__Unit_of_Measure__c, enxCPQ__Value_From__c, enxCPQ__Value_To__c,enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, enxCPQ__Save_Before_Calculation__c, RecordTypeId, enxCPQ__Dimension_1__c, enxCPQ__Dimension_1_Numeric__c, enxCPQ__Dimension_2__c, enxCPQ__Dimension_2_Numeric__c, enxCPQ__Dimension_3__c, enxCPQ__Dimension_3_Numeric__c, enxCPQ__Dimension_4__c, enxCPQ__Dimension_4_Numeric__c, enxCPQ__Dimension_5__c, enxCPQ__Dimension_5_Numeric__c FROM Product2 WHERE (Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution') OR enxCPQ__Root_Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution')) AND RecordType.Name != 'Charge Element' AND IsActive = true", function(err, res) {
//             if (err) { 
//                 reject('error retrieving products: ' + err);
//                 return;
//             }
//             console.log("--- products: " + res.records.length);
//             resolve(res.records);
//         });
//     }),
        
//     queryProductIds: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE (Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution') OR enxCPQ__Root_Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution')) AND RecordType.Name != 'Charge Element' AND IsActive = true", function(err, res) {
//             if (err) reject('error retrieving product ids: ' + err);
//             console.log("--- product ids: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryAttributeValues: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, enxCPQ__Active__c, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, enxCPQ__Order__c, enxCPQ__TECH_External_Id__c, enxCPQ__TECH_Definition_Id__c FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = true OR enxCPQ__Exclusive_for_Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution')", function(err, res) {
//             if (err) reject('error retrieving attribute values: ' + err);
//             console.log("--- attribute values: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryProductAttributeIds: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Id FROM enxCPQ__ProductAttribute__c", function(err, res) {
//             if (err) reject('error retrieving product attribute ids: ' + err);
//             console.log("--- product attribute ids: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryProductAttributes: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, enxCPQ__Active__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Option_Affecting__c, enxCPQ__Order__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product_Field_to_Update__c, RecordTypeId, enxCPQ__Role__c, enxCPQ__TECH_External_Id__c, enxCPQ__Value_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Value_Boolean__c, enxCPQ__Value_Currency__c, enxCPQ__Value_Date__c, enxCPQ__Value_Number__c, enxCPQ__Value_Percent__c, enxCPQ__Value_Text_Long__c, enxCPQ__Value_Text_Short__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution')", function(err, res) {
//             if (err) reject('error retrieving product attributes: ' + err);
//             console.log("--- product attributes: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryPricebooks: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, IsActive, Description, enxCPQ__Master__c, enxCPQ__Reference_Master_field__c, enxCPQ__TECH_External_Id__c, enxCPQ__Use_UnitPrice__c, enxCPQ__Valid_From__c, enxCPQ__Valid_To__c FROM Pricebook2 WHERE IsStandard = false AND IsActive = true", function(err, res) {
//             if (err) reject('error retrieving pricebooks: ' + err);
//             console.log("--- pricebooks: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryPricebooksIds: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Id, enxCPQ__TECH_External_Id__c, IsStandard FROM Pricebook2", function(err, res) {
//             if (err) reject('error retrieving pricebook ids: ' + err);
//             console.log("--- pricebooks ids: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryStdPricebookEntries: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT IsActive, enxCPQ__Charge_List_Price__c, CurrencyIsoCode, enxCPQ__Current_Pricebook_Inventory__c, enxCPQ__Current_Pricebook_Lead_Time__c, UnitPrice, enxCPQ__MRC_List__c, enxB2B__MRC_List__c, enxCPQ__OTC_List__c, enxB2B__OTC_List__c, Pricebook2Id, enxCPQ__Price_Modifier_Amount__c, enxCPQ__Price_Modifier_Percent__c, enxCPQ__Price_Override__c, Product2Id, enxB2B__Service_Capex__c, UseStandardPrice FROM PricebookEntry WHERE (Product2.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution') OR Product2.enxCPQ__Root_Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution')) AND Pricebook2.IsStandard = true AND Product2.RecordType.Name != 'Charge Element' AND IsActive = true", function(err, res) {
//             if (err) reject('error retrieving pricebook entries: ' + err);
//             console.log("--- pricebook entries: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryPricebookEntries: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT IsActive, enxCPQ__Charge_List_Price__c, CurrencyIsoCode, enxCPQ__Current_Pricebook_Inventory__c, enxCPQ__Current_Pricebook_Lead_Time__c, UnitPrice, enxCPQ__MRC_List__c, enxB2B__MRC_List__c, enxCPQ__OTC_List__c, enxB2B__OTC_List__c, Pricebook2Id, enxCPQ__Price_Modifier_Amount__c, enxCPQ__Price_Modifier_Percent__c, enxCPQ__Price_Override__c, Product2Id, enxB2B__Service_Capex__c, UseStandardPrice FROM PricebookEntry WHERE (Product2.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution') OR Product2.enxCPQ__Root_Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution')) AND Pricebook2.IsStandard = false AND Product2.RecordType.Name != 'Charge Element' AND IsActive = true", function(err, res) {
//             if (err) reject('error retrieving pricebook entries: ' + err);
//             console.log("--- pricebook entries: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryStdPricebookEntryIds: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Id FROM PricebookEntry WHERE (Product2.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution') OR Product2.enxCPQ__Root_Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution')) AND Pricebook2Id != null AND Pricebook2.IsStandard = true AND product2.isactive = true AND Product2.RecordType.Name != 'Charge Element' AND IsActive = true", function(err, res) {
//             if (err) reject('error retrieving pricebook entry ids: ' + err);
//             console.log("--- pricebook entry ids: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryPricebookEntryIds: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Id FROM PricebookEntry WHERE (Product2.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution') OR Product2.enxCPQ__Root_Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution')) AND Pricebook2Id != null AND Pricebook2.IsStandard = false AND product2.isactive = true AND Product2.RecordType.Name != 'Charge Element' AND IsActive = true", function(err, res) {
//             if (err) reject('error retrieving pricebook entry ids: ' + err);
//             console.log("--- pricebook entry ids: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryProductRelationships: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, enxCPQ__Max_Occurrences__c, enxCPQ__Min_Occurrences__c, enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Relationship_Type__c, enxCPQ__Secondary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution') AND enxCPQ__Secondary_Product__c != null", function(err, res) {
//             if (err) reject('error retrieving product relationships: ' + err);
//             console.log("--- product relationships: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryAttributeDefaultValues: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value_Text__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeDefaultValue__c WHERE enxCPQ__Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution') AND (enxCPQ__Attribute_Value__c != null OR enxCPQ__Attribute_Value_Text__c != '')", function(err, res) {
//             if (err) reject('error retrieving attribute default values: ' + err);
//             console.log("--- attribute default values: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryAttributeValueDependency: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Execution_Order__c, enxCPQ__Master_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c, enxCPQ__TECH_Key__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Product__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution')", function(err, res) {
//             if (err) reject('error retrieving attribute value dependencies: ' + err);
//             console.log("--- attribute value dependencies: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryAttributeRules: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT enxCPQ__Active__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Update_Logic__c, enxCPQ__Criteria__c, enxCPQ__Error_Message__c, enxCPQ__Order__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordTypeId, enxCPQ__Regexp__c, enxCPQ__Rule_Attribute_Update_Logic__c, enxCPQ__Rule_Criteria__c, enxCPQ__TECH_External_Id__c, enxCPQ__Validation_Type__c, enxCPQ__Value_From__c, enxCPQ__Value_To__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeRule__c WHERE enxCPQ__Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution')", function(err, res) {
//             if (err) reject('error retrieving attribute rules: ' + err);
//             console.log("--- attribute rules: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryProvisioningPlans: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, enxB2B__Support_Plan__c, enxB2B__TECH_External_Id__c FROM enxB2B__ProvisioningPlan__c", function(err, res) {
//             if (err) reject('error retrieving provisioning plans: ' + err);
//             console.log("--- provisioning plans: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryProvisioningTasks: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, enxB2B__Apex_handler_reference__c, enxB2B__Automated_Task_Type__c, enxB2B__Description__c, enxB2B__Order__c, RecordTypeId, enxB2B__Status__c, enxB2B__TECH_External_Id__c, enxB2B__Type__c  FROM enxB2B__ProvisioningTask__c", function(err, res) {
//             if (err) reject('error retrieving provisioning tasks: ' + err);
//             console.log("--- provisioning tasks: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryProvisioningPlanAssignmentIds: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Id FROM enxB2B__ProvisioningPlanAssignment__c", function(err, res) {
//             if (err) reject('error retrieving provisioning plan assigment ids: ' + err);
//             console.log("--- provisioning plan assigment ids: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryProvisioningTaskAssignmentIds: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Id FROM enxB2B__ProvisioningTaskAssignment__c", function(err, res) {
//             if (err) reject('error retrieving provisioning task assigment ids: ' + err);
//             console.log("--- provisioning task assigment ids: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryProvisioningPlanAssignments: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT enxB2B__Active__c, enxB2B__Criteria__c, enxB2B__Item_Action__c, enxB2B__Order__c, enxB2B__Product__r.enxCPQ__TECH_External_Id__c, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, enxB2B__TECH_External_ID__c FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution')", function(err, res) {
//             if (err) reject('error retrieving provisioning plan assignments: ' + err);
//             console.log("--- provisioning plan assignments: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryProvisioningTaskAssignments: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT enxB2B__Criteria__c, enxB2B__Order__c, enxB2B__Predecessors__c, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, enxB2B__Provisioning_Task__r.enxB2B__TECH_External_Id__c, enxB2B__Status__c, enxB2B__TECH_External_ID__c FROM enxB2B__ProvisioningTaskAssignment__c", function(err, res) {
//             if (err) reject('error retrieving provisioning task assignments: ' + err);
//             console.log("--- provisioning task assignments: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryPriceRules: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, RecordTypeId, enxCPQ__Account__r.enxCPQ__TECH_External_Id__c, enxCPQ__Active__c, enxCPQ__Conditions_Logic__c, enxCPQ__Order__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c, enxCPQ__Tier_Field__c FROM enxCPQ__PriceRule__c", function(err, res) {
//             if (err) reject('error retrieving price rules: ' + err);
//             console.log("--- price rules: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryPriceRuleConditions: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Field_Name__c, enxCPQ__Operator__c, enxCPQ__Order__c, enxCPQ__Price_Rule__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c, enxCPQ__Value__c FROM enxCPQ__PriceRuleCondition__c", function(err, res) {
//             if (err) reject('error retrieving price rule conditions: ' + err);
//             console.log("--- price rule conditions: " + res.records.length);
//             resolve(res.records);
//         });
//     }),

//     queryPriceRuleActions: (conn) => new Promise((resolve, reject) => {
//         conn.query("SELECT Name, enxCPQ__Action_Type__c, enxCPQ__Charge__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Field_Name__c, enxCPQ__Order__c, enxCPQ__Price_Rule__r.enxCPQ__TECH_External_Id__c, enxCPQ__Target_Field_Name__c, enxCPQ__Target_Value__c, enxCPQ__TECH_External_Id__c, enxCPQ__Tier_Value_From__c, enxCPQ__Tier_Value_To__c FROM enxCPQ__PriceRuleAction__c", function(err, res) {
//             if (err) reject('error retrieving price rule actions: ' + err);
//             console.log("--- price rule actions: " + res.records.length);
//             resolve(res.records);
//         });
//     }),    

//     bulkQueryChargeElements: (conn) => new Promise((resolve, reject) => {
//         var records = []; 
//         conn.bulk.query("SELECT Name, IsActive, enxCPQ__Billing_Frequency__c, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Criteria__c, enxCPQ__Charge_Item_Action__c, enxCPQ__Charge_Model__c, enxCPQ__Charge_Name__c, enxCPQ__Charge_Type__c, enxCPQ__Current_Inventory__c, enxCPQ__Current_Lead_Time__c, enxCPQ__Description_DE__c, enxCPQ__Description_EN__c, enxCPQ__Description_ES__c, enxCPQ__Description_FR__c, enxCPQ__Description_IT__c, enxCPQ__Description_Pattern__c, enxCPQ__Description_PL__c, enxCPQ__Hide_in_Product_Catalogue__c, enxCPQ__Ignore_Inventory_Management__c, enxCPQ__Ignore_Option_Requirement__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Field__c, enxCPQ__Name_DE__c, enxCPQ__Name_EN__c, enxCPQ__Name_ES__c, enxCPQ__Name_FR__c, enxCPQ__Name_IT__c, enxCPQ__Name_PL__c, ProductCode, Description, Family, enxCPQ__Product_Lifecycle_Version__c,enxCPQ__TECH_Bundle_Element__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c,enxCPQ__TECH_Is_Configurable__c, enxCPQ__TECH_Option_JSON__c, enxCPQ__Unit_of_Measure__c, enxCPQ__Value_From__c, enxCPQ__Value_To__c,enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordTypeId, enxCPQ__Column_Value__c, enxCPQ__Row_Value__c, enxCPQ__Dimension_1_Value__c, enxCPQ__Dimension_2_Value__c, enxCPQ__Dimension_3_Value__c,enxCPQ__Dimension_4_Value__c, enxCPQ__Dimension_5_Value__c FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution') AND RecordType.Name = 'Charge Element' AND IsActive = true")
//             .on('record', function(rec) { 
//                 if (records.length % 100 == 0) {
//                     process.stdout.write("--- querying charge elements. Retrieved: " + records.length + " records\r");
//                 }
//                 records.push(rec);
//             })
//             .on('error', function(err) { 
//                 console.error(err); 
//             })
//             .on('end', function(info) { 
//                 console.log("--- charge elements: " + records.length + "                                ");
                
//                 fs.writeFile("./temp/products.json", JSON.stringify(records), function(err) {
//                     if(err) {
//                         return console.log(err);
//                     }
//                     console.log("----- charge elements file was saved");
//                     resolve(records); 
//                 }); 
                
//             })
//     }),

//     // FIELDS removed from query because they were putting "0" instead of null -> enxCPQ__Price_Modifier_Amount__c, enxCPQ__Price_Modifier_Percent__c, enxCPQ__Price_Override__c
//     bulkQueryChargeElementStdPricebookEntries: (conn) => new Promise((resolve, reject) => {
//         var records = []; 
//         conn.bulk.query("SELECT IsActive, enxCPQ__Charge_List_Price__c, CurrencyIsoCode, enxCPQ__Current_Pricebook_Inventory__c, enxCPQ__Current_Pricebook_Lead_Time__c, UnitPrice, enxCPQ__MRC_List__c, enxB2B__MRC_List__c, enxCPQ__OTC_List__c, enxB2B__OTC_List__c, Pricebook2Id, Product2Id, enxB2B__Service_Capex__c, UseStandardPrice FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution') AND Pricebook2.IsStandard = true AND Product2.RecordType.Name = 'Charge Element' AND IsActive = true")
//             .on('record', function(rec) { 
//                 if (records.length % 100 == 0) {
//                     process.stdout.write("--- querying charge element std pricebook entries. Retrieved: " + records.length + " records\r");
//                 }
//                 records.push(rec);
//             })
//             .on('error', function(err) { 
//                 console.error(err); 
//             })
//             .on('end', function(info) { 
//                 console.log("--- charge element pricebook entries: " + records.length + "                                ");
                
//                 fs.writeFile("./temp/stdpricebookentries.json", JSON.stringify(records), function(err) {
//                     if(err) {
//                         return console.log(err);
//                     }
//                     console.log("----- charge element std pricebook entries file was saved");
//                     resolve(records); 
//                 }); 
                
//             });
//     }),

//     // FIELDS removed from query because they were putting "0" instead of null -> enxCPQ__Price_Modifier_Amount__c, enxCPQ__Price_Modifier_Percent__c, enxCPQ__Price_Override__c
//     bulkQueryChargeElementPricebookEntries: (conn) => new Promise((resolve, reject) => {
//         var records = []; 
//         conn.bulk.query("SELECT IsActive, enxCPQ__Charge_List_Price__c, CurrencyIsoCode, enxCPQ__Current_Pricebook_Inventory__c, enxCPQ__Current_Pricebook_Lead_Time__c, UnitPrice, enxCPQ__MRC_List__c, enxB2B__MRC_List__c, enxCPQ__OTC_List__c, enxB2B__OTC_List__c, Pricebook2Id, Product2Id, enxB2B__Service_Capex__c, UseStandardPrice FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN ('GEPL', 'VPLS', 'VPLS Port', 'AMS-IX', 'Cage', 'Colocation Service', 'Cross Connect', 'Dark Fibre', 'MetroLambda', 'VPN', 'VPN Port', 'IPLC', 'IP Transit (IPTx)', 'HGC Connect', 'AWS Direct Connect', 'AWS Site', 'MetroNet/ MetroConnect', 'Metro Port', 'SDH Local Loop', 'EoSDH', 'EoSDH Port', 'Non-Standard Solution') AND Pricebook2.IsStandard = false AND Product2.RecordType.Name = 'Charge Element' AND IsActive = true")
//             .on('record', function(rec) { 
//                 if (records.length % 100 == 0) {
//                     process.stdout.write("--- querying charge element pricebook entries. Retrieved: " + records.length + " records\r");
//                 }
//                 records.push(rec);
//             })
//             .on('error', function(err) { 
//                 console.error(err); 
//             })
//             .on('end', function(info) { 
//                 console.log("--- charge element pricebook entries: " + records.length + "                                ");
                
//                 fs.writeFile("./temp/pricebookentries.json", JSON.stringify(records), function(err) {
//                     if(err) {
//                         return console.log(err);
//                     }
//                     console.log("----- charge element pricebook entries file was saved");
//                     resolve(records); 
//                 }); 
                
//             });
//     }),

//     bulkQueryChargeElementPricebookEntryIds: (conn) => new Promise((resolve, reject) => {
//         var records = []; 
//         conn.bulk.query("SELECT Id FROM PricebookEntry WHERE Product2.RecordType.Name = 'Charge Element'")
//             .on('record', function(rec) { 
//                 if (records.length % 100 == 0) {
//                     process.stdout.write("--- querying charge element pricebook entries ids. Retrieved: " + records.length + " records\r");
//                 }
//                 records.push(rec);
//             })
//             .on('error', function(err) { 
//                 console.error(err); 
//             })
//             .on('end', function(info) { 
//                 console.log("--- charge element pricebook entries ids: " + records.length + "                                ");
                
//                 fs.writeFile("./temp/pricebookentriestodelids.json", JSON.stringify(records), function(err) {
//                     if(err) {
//                         return console.log(err);
//                     }
//                     console.log("----- charge element pricebook entries ids file was saved");
//                     resolve(records); 
//                 }); 
                
//             });
//     }),

//     bulkQueryProductIds: (conn) => new Promise((resolve, reject) => {
//         var records = []; 
//         conn.bulk.query("SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE RecordType.Name = 'Charge Element'")
//             .on('record', function(rec) { 
//                 if (records.length % 100 == 0) {
//                     process.stdout.write("--- querying product ids. Retrieved: " + records.length + " records\r");
//                 }
//                 records.push(rec);
//             })
//             .on('error', function(err) { 
//                 console.error(err); 
//             })
//             .on('end', function(info) { 
//                 console.log("--- querying product ids completed. Retrieved: " + records.length + "                                ");
//                 resolve(records);
//             });
//     }),

//     bulkQueryStdPricebookEntryIds: (conn) => new Promise((resolve, reject) => {
//         var records = []; 
//         conn.bulk.query("SELECT Id FROM PricebookEntry WHERE Pricebook2Id != null AND Pricebook2.IsStandard = true AND product2.isactive = true AND Product2.RecordType.Name = 'Charge Element'")
//             .on('record', function(rec) { 
//                 if (records.length % 100 == 0) {
//                     process.stdout.write("--- querying std pbe ids. Retrieved: " + records.length + " records\r");
//                 }
//                 records.push(rec);
//             })
//             .on('error', function(err) { 
//                 console.error(err); 
//             })
//             .on('end', function(info) { 
//                 console.log("--- querying std pbe ids completed. Retrieved: " + records.length + "                                ");
//                 resolve(records); 
//             });
//     }),

//     bulkQueryPricebookEntryIds: (conn) => new Promise((resolve, reject) => {
//         var records = []; 
//         conn.bulk.query("SELECT Id FROM PricebookEntry WHERE Pricebook2Id != null AND Pricebook2.IsStandard = false AND product2.isactive = true AND Product2.RecordType.Name = 'Charge Element'")
//             .on('record', function(rec) { 
//                 if (records.length % 100 == 0) {
//                     process.stdout.write("--- querying pbe ids. Retrieved: " + records.length + " records\r");
//                 }
//                 records.push(rec);
//             })
//             .on('error', function(err) { 
//                 console.error(err); 
//             })
//             .on('end', function(info) { 
//                 console.log("--- querying pbe ids completed. Retrieved: " + records.length + "                                ");
//                 resolve(records); 
//             });
//     })

// }