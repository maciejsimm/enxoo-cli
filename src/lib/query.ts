import { Connection } from 'jsforce';
import { Util } from './Util';
import {Query} from  '../entity/queryEntity';
export class Queries {
    private static productQuery: string;
    private static bundleElementQuery: string;
    private static bundleElementOptionQuery: string;
    private static pricebookQuery: string;
    private static pbeQuery: string;
    private static productAttrQuery: string;
    private static attrSetAttrQuery: string;
    private static attrQuery: string;
    private static attrValuesQuery: string;
    private static attrDefaultValuesQuery: string;
    private static productRelationshipsQuery: string;
    private static attrValueDependecyQuery: string;
    private static attrRulesQuery: string;
    private static categoryQuery: string;
    private static attrSetQuery: string;
    private static prvPlanAssignmentQuery: string;
    private static prvTaskQuery: string;
    private static prvPlanQuery: string;
    private static prvTaskAssignmentQuery: string;
    private static isRelated: boolean;
    private static currencies:Set<String>;

    public static setIsRelated(isRelated: boolean){
        this.isRelated = isRelated;
    }

    public static setCurrencies(currencies: Set<String>){
        this.currencies = currencies;
    }

    public static async retrieveQueryJson(queryDir: string){
       let queryJson = await Util.readQueryJson(queryDir);
       this.productQuery= queryJson['productFieldNames'];
       this.bundleElementQuery = queryJson['bundleElementFieldNames'];
       this.bundleElementOptionQuery = queryJson['bundleElementOptionFieldNames'];
       this.pricebookQuery= queryJson['pricebookFieldNames'];
       this.pbeQuery = queryJson['pbeFieldNames'];
       this.productAttrQuery= queryJson['productAttrFieldNames'];
       this.attrSetAttrQuery= queryJson['attrSetAttrFieldNames'];
       this.attrQuery= queryJson['attrFieldNames'];
       this.attrValuesQuery= queryJson['attrValuesFieldNames'];
       this.attrDefaultValuesQuery= queryJson['attrDefaultValuesFieldNames'];
       this.productRelationshipsQuery= queryJson['productRelationshipsFieldNames'];
       this.attrValueDependecyQuery= queryJson['attrValueDependecyFieldNames'];
       this.attrRulesQuery= queryJson['attrRulesFieldNames'];
       this.categoryQuery= queryJson['categoryFieldNames'];
       this.attrSetQuery= queryJson['attrSetFieldNames'];
       this.prvPlanAssignmentQuery= queryJson['prvPlanAssignmentFieldNames'];
       this.prvTaskQuery= queryJson['prvTaskFieldNames'];
       this.prvPlanQuery= queryJson['prvPlanFieldNames'];
       this.prvTaskAssignmentQuery= queryJson['prvTaskAssignmentFieldNames'];
    }

    public static async describeAllFields(conn: Connection, sObjectName: string): Promise<String[]> {
        Util.log('--- describing all fields for sObject Name ' + sObjectName);
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            conn.sobject(sObjectName).describe(function(err, meta) {
                if (err) { return console.error(err); }
                resolve(meta.fields)
              });
        })
    }

    public static async queryAllProductNames(conn: Connection):Promise<String[]> {
        const queriedObjectsLabel: string = 'all Product Names';
        const query = "SELECT Id, Name FROM Product2 WHERE RecordType.Name = 'Product' OR RecordType.Name = 'Bundle'";
        const countQuery = "SELECT count(Id) FROM Product2 WHERE RecordType.Name = 'Product' OR RecordType.Name = 'Bundle'";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryRecordTypes(conn: Connection): Promise<String[]> {
        const queriedObjectsLabel: string = 'record types';
        const query: string =  "SELECT Id, Name FROM RecordType WHERE SObjectType='Product2'";
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryTargetProductIds(conn: Connection,  techIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'target productIds';
        if(techIds.size>90){
    
            let paramsObject1: Query ={     
              "queryBegining": "SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE enxCPQ__TECH_External_Id__c IN (",
              "queryConditions": ") AND RecordType.Name IN ('Product', 'Bundle', 'Option','Resource')",
              "objectsList": techIds,
              "sObjectName": queriedObjectsLabel,
              "countQuery": "SELECT count(Id) FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN ("
          }
  
            return await Util.createQueryPromiseArray(paramsObject1, conn);
        }
    
        const query = "SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(techIds) + 
            ") AND RecordType.Name IN ('Product', 'Bundle', 'Option','Resource')";
        const countQuery = "SELECT count(Id) FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (" 
        + Util.setToIdString(techIds) + ") AND enxCPQ__Secondary_Product__c != null";
        const numberOfRecords = await Util.countResults(conn, "standard PricebookEntry", countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryTargetChargesIds(conn: Connection, techIds: Set<String>,): Promise<String[]> {
        const queriedObjectsLabel: string = 'Target Charges Ids';
        if(techIds.size>90){
    
            let paramsObject1: Query ={     
              "queryBegining": "SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE enxCPQ__TECH_External_Id__c IN (",
              "queryConditions": ") AND RecordType.Name IN ('Charge Element', 'Charge', 'Charge Tier')",
              "objectsList": techIds,
              "sObjectName": queriedObjectsLabel,
              "countQuery": "SELECT count(Id) FROM Product2 WHERE enxCPQ__TECH_External_Id__c IN ("
           }
  
            return await Util.createQueryPromiseArray(paramsObject1, conn);
        }

        const query = "SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(techIds) +
            ") AND RecordType.Name IN ('Charge Element', 'Charge', 'Charge Tier')";
        const countQuery = "SELECT count(Id) FROM Product2 WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(techIds) +
            ") AND RecordType.Name IN ('Charge Element', 'Charge', 'Charge Tier')";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
    
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryTargetStdPricebookEntry(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'Target Std PricebookEntry';
        if(productList.size >90){

            let paramsObject1: Query ={     
              "queryBegining": "SELECT  Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.Name IN (",
              "queryConditions": ") AND Pricebook2.IsStandard = true",
              "objectsList": productList,
              "sObjectName": queriedObjectsLabel,
              "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.Name IN ("
          }
            let paramsObject2: Query ={     
              "queryBegining": "SELECT  Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
              "queryConditions": ") AND Pricebook2.IsStandard = true",
              "objectsList": productList,
              "sObjectName": queriedObjectsLabel,
              "countQuery":  "SELECT count(Id) FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
          }
            if(this.currencies){
                paramsObject1['queryConditions'] =  paramsObject1['queryConditions'] + " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") ";
                paramsObject2['queryConditions'] =  paramsObject2['queryConditions'] + " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") "
            }
        
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }

        let query = "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id, " + this.pbeQuery + 
        " FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) +
         ")) AND Pricebook2.IsStandard = true";

        let countQuery = "SELECT count(Id) FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) +
            ")) AND Pricebook2.IsStandard = true";
        if(this.currencies){
            const extraCondition = " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ")"
            query = query + extraCondition;
            countQuery = countQuery + extraCondition;
        }
    
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryTargetPricebookEntry(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'target PricebookEntry';
        if(productList.size >90){

            let paramsObject1: Query ={     
              "queryBegining": "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.Name IN (",
              "queryConditions": ") AND Pricebook2.IsStandard = false",
              "objectsList": productList,
              "sObjectName": queriedObjectsLabel,
              "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.Name IN ("
          }
            let paramsObject2: Query ={     
              "queryBegining": "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
              "queryConditions": ") AND Pricebook2.IsStandard = false",
              "objectsList": productList,
              "sObjectName": queriedObjectsLabel,
              "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN ("
          }
            if(this.currencies){
                paramsObject1['queryConditions'] =  paramsObject1['queryConditions'] + " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") ";
                paramsObject2['queryConditions'] =  paramsObject2['queryConditions'] + " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") "
            }

            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }

        let query = "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id, " + this.pbeQuery + 
            " FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) +
            ")) AND Pricebook2.IsStandard = false";

        let countQuery = "SELECT count(Id) FROM PricebookEntry WHERE (Product2.Name IN (" 
            + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) +
            ")) AND Pricebook2.IsStandard = false";

        if(this.currencies){
            const extraCondition = " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ")";
            query = query + extraCondition;
            countQuery = countQuery + extraCondition;
        }

        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProductAttributeIds(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'Product Attribute Ids';
        if(productList.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (",
                "queryConditions": ")",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ")";
        const countQuery = "SELECT count(Id) FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ")";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryPricebooksIds(conn: Connection): Promise<String[]> {
        const queriedObjectsLabel: string = 'pricebook ids';
        const query : string = "SELECT Id, enxCPQ__TECH_External_Id__c, IsStandard FROM Pricebook2";
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProductIds(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'Product Ids';
        if(productList.size >90){
            let paramsObject1: Query={
                "queryBegining":"SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE Name IN (",
                "queryConditions": ")",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM Product2 WHERE Name IN (",
            }
            let paramsObject2: Query={
                "queryBegining":"SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ")",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN (",
            }
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }

        const query = "SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE (Name IN (" + Util.setToIdString(productList) + 
            ") OR enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + "))"
        const countQuery = "SELECT count(Id) FROM Product2 WHERE (Name IN (" + Util.setToIdString(productList) + 
            ") OR enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + "))";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryStdPricebookEntries(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'standard PricebookEntry';
        if(productList.size >90){

            let paramsObject1: Query ={     
              "queryBegining": "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.Name IN (",
              "queryConditions": ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name != 'Charge Element'",
              "objectsList": productList,
              "sObjectName": queriedObjectsLabel,
              "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.Name IN ("
          }
            let paramsObject2: Query ={     
              "queryBegining": "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
              "queryConditions": ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name != 'Charge Element'",
              "objectsList": productList,
              "sObjectName": queriedObjectsLabel,
              "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN ("
          }
            if(this.currencies){
                paramsObject1['queryConditions'] =  paramsObject1['queryConditions'] + " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") ";
                paramsObject2['queryConditions'] =  paramsObject2['queryConditions'] + " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") "
            }
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }

        let query = "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id, " + this.pbeQuery + 
            " FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) +
            ")) AND Pricebook2.IsStandard = true AND Product2.RecordType.Name != 'Charge Element'";
        
        let countQuery = "SELECT count(Id) FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) +
            ")) AND Pricebook2.IsStandard = true AND Product2.RecordType.Name != 'Charge Element'";

        if(this.currencies){
            const extraCondition = " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ")";
            query = query + extraCondition;
            countQuery = countQuery + extraCondition;
        }

        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
  }

    public static async queryPricebookEntryCurrencies(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'pricebook entry currencies';
        if(productList.size >90){
            let paramsObject1: Query={
                "queryBegining": "SELECT Id, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode FROM PricebookEntry WHERE Product2.Name IN (",
                "queryConditions": ")",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.Name IN (",
            }
            let paramsObject2: Query={
                "queryBegining": "SELECT Id, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ")",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
            }
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }

        const query = "SELECT Id, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode FROM PricebookEntry WHERE (Product2.Name IN (" +
            Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + "))";
        const countQuery = "SELECT count(Id) FROM PricebookEntry WHERE (Product2.Name IN (" +
            Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + "))";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryPricebooks(conn: Connection): Promise<String[]> {
        const queriedObjectsLabel: string = 'pricebooks';
        const query = "SELECT Id, IsStandard, "+ this.pricebookQuery+" FROM Pricebook2 WHERE (IsActive = true OR IsStandard = true)";
        const countQuery = "SELECT count(Id) FROM Pricebook2 WHERE IsActive = true OR IsStandard = true";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryPricebookEntries(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'PricebookEntry';
        if(productList.size >90){
           
            let paramsObject1: Query={     
                "queryBegining": "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.Name IN (",
                "queryConditions": ") AND Pricebook2.IsStandard = false AND Product2.RecordType.Name != 'Charge Element'",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,          
                "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.Name IN ("
            }
            let paramsObject2: Query={     
                "queryBegining": "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND Pricebook2.IsStandard = false AND Product2.RecordType.Name != 'Charge Element'",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN ("
            } 
            if(this.currencies){
                paramsObject1['queryConditions'] =  paramsObject1['queryConditions'] + " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") ";
                paramsObject2['queryConditions'] =  paramsObject2['queryConditions'] + " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") "
            }   
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }

        let query = "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id, " + this.pbeQuery + 
        " FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + 
        ")) AND Pricebook2.IsStandard = false AND Product2.RecordType.Name != 'Charge Element'";
        
        let countQuery = "SELECT count(Id) FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + 
        ")) AND Pricebook2.IsStandard = false AND Product2.RecordType.Name != 'Charge Element'";

        if(this.currencies){
            const extraCondition = " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ")";
            query= query + extraCondition;
            countQuery = countQuery + query;
        }

        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProduct(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'Product';
        if(productList.size >90){
            let paramsObject: Query={
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE Name IN (",
                "queryConditions": ")",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM Product2 WHERE Name IN (",
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "
            +this.productQuery+" FROM Product2 WHERE Name IN (" + Util.setToIdString(productList) + ")";
        const countQuery = "SELECT count(Id) FROM Product2 WHERE Name IN (" + Util.setToIdString(productList) + ")";
            ") AND RecordType.Name IN ('Charge Element', 'Charge', 'Charge Tier')";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

       return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProductAttributes(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'product attributes';
        if(productList.size >90){
            let paramsObject: Query={
                "queryBegining": "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.Name, enxCPQ__Value_Attribute__r.enxCPQ__TECH_External_Id__c,  enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, " + this.productAttrQuery + " FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (",
                "queryConditions": ") ",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.Name, enxCPQ__Value_Attribute__r.enxCPQ__TECH_External_Id__c,  enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "
            + this.productAttrQuery + " FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ") ";
        const countQuery = "SELECT count(Id) FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ") ";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }


    public static async queryProductOptions(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'Target product options';
        if(productList.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+ " FROM Product2 WHERE RecordType.Name = 'Option' AND enxCPQ__Parent_Product__r.Name IN (",
                "queryConditions": ") ",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM Product2 WHERE RecordType.Name = 'Option' AND enxCPQ__Parent_Product__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        const query = "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "
            +this.productQuery+ " FROM Product2 WHERE RecordType.Name = 'Option' AND enxCPQ__Parent_Product__r.Name IN (" + Util.setToIdString(productList) + ") ";
        const countQuery = "SELECT count(Id) FROM Product2 WHERE RecordType.Name = 'Option' AND enxCPQ__Parent_Product__r.Name IN (" + Util.setToIdString(productList) + ") ";
            ") AND RecordType.Name IN ('Charge Element', 'Charge', 'Charge Tier')";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryAttributeSetAttributes(conn: Connection, attributeSetIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'attributes set attributes';
        if(attributeSetIds.size === 0){
            return[];
        }
        if(attributeSetIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, "+ this.attrSetAttrQuery +" FROM enxCPQ__AttributeSetAttribute__c WHERE enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ") ",
                "objectsList": attributeSetIds,
                "sObjectName": "attributes set attributes",
                
                "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        const query = "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, "+ this.attrSetAttrQuery +
            " FROM enxCPQ__AttributeSetAttribute__c WHERE enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeSetIds) + ") ";
        const countQuery = "SELECT count(Id) FROM enxCPQ__AttributeSetAttribute__c WHERE enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeSetIds) + ") "
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryAttributes(conn: Connection, attributeIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'attributes';
        if(attributeIds.size === 0){
            return[];
        }
        if(attributeIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, "+ this.attrQuery +" FROM enxCPQ__Attribute__c WHERE enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": attributeIds,
                "sObjectName": "attributes",
                
                "countQuery": "SELECT count(Id) FROM enxCPQ__Attribute__c WHERE enxCPQ__TECH_External_Id__c IN (",
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, "+ this.attrQuery +" FROM enxCPQ__Attribute__c WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeIds) + ") ";
        const countQuery = "SELECT count(Id) FROM enxCPQ__Attribute__c WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeIds) + ") ";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProvisioningTasks(conn: Connection, provisioningTaskIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'provisioning tasks';
        if(provisioningTaskIds.size === 0){
            return[];
        }
        if(provisioningTaskIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, "+ this.prvTaskQuery+" FROM enxB2B__ProvisioningTask__c WHERE enxB2B__TECH_External_Id__c IN  (",
                "queryConditions": ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name != 'Charge Element'",
                "objectsList": provisioningTaskIds,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxB2B__ProvisioningTask__c WHERE enxB2B__TECH_External_Id__c IN  ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, "+ this.prvTaskQuery+" FROM enxB2B__ProvisioningTask__c WHERE enxB2B__TECH_External_Id__c IN  (" + Util.setToIdString(provisioningTaskIds) + ")";
        const countQuery = "SELECT count(Id) FROM enxB2B__ProvisioningTask__c WHERE enxB2B__TECH_External_Id__c IN  (" + Util.setToIdString(provisioningTaskIds) + ")";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProvisioningPlans(conn: Connection, provisioningPlanIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'provisioning plans';
        if(provisioningPlanIds.size === 0){
            return[];
        }
        if(provisioningPlanIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, "+ this.prvPlanQuery+" FROM enxB2B__ProvisioningPlan__c WHERE enxB2B__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": provisioningPlanIds,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxB2B__ProvisioningPlan__c WHERE enxB2B__TECH_External_Id__c IN (",
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, "+ this.prvPlanQuery+" FROM enxB2B__ProvisioningPlan__c WHERE enxB2B__TECH_External_Id__c IN (" + Util.setToIdString(provisioningPlanIds) + ")"
        const countQuery = "SELECT count(Id) FROM enxB2B__ProvisioningPlan__c WHERE enxB2B__TECH_External_Id__c IN (" + Util.setToIdString(provisioningPlanIds) + ")"
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async  queryProductCharges(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'product charges';
        if(productList.size >90){
            let  paramsObject={
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE RecordType.Name = 'Charge' AND (enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") OR enxCPQ__Charge_Reference__c !=null)  ",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM Product2 WHERE RecordType.Name = 'Charge' AND (enxCPQ__Root_Product__r.Name IN ("
             }
            if(this.isRelated ){
                paramsObject.queryBegining = "SELECT enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE RecordType.Name = 'Charge' AND (enxCPQ__Root_Product__r.Name IN (";
            }

            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        let query = this.isRelated 
            ?"SELECT enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, "
            :"SELECT ";
        query = query + "Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "
                +this.productQuery+" FROM Product2 WHERE RecordType.Name = 'Charge' AND (enxCPQ__Root_Product__r.Name IN (" 
                + Util.setToIdString(productList) + ") OR enxCPQ__Charge_Reference__c !=null)  ";
        const countQuery = "SELECT count(Id) FROM Product2 WHERE RecordType.Name = 'Charge' AND (enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) 
            + ") OR enxCPQ__Charge_Reference__c !=null)  "

        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryReferenceCharges(conn: Connection, chargeList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'reference charges';
        if(chargeList.size >90){
            let paramsObject: Query={
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ") ",
                "objectsList": chargeList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__TECH_External_Id__c IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "
            +this.productQuery+" FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(chargeList) + ") ";

        const countQuery = "SELECT count(Id) FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(chargeList) + ") ";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProductChargesIds(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'product charges ids';
        if(productList.size >90){
            let paramsObject: Query={
                "queryBegining": "SELECT Id, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") ",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__Root_Product__r.Name IN (",
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__Root_Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const countQuery = "SELECT count(Id) FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__Root_Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryBundleElementsIds(conn: Connection, bundleList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'bundle elements ids';

        if(bundleList.size > 90){
            let paramsObject: Query = {
                "queryBegining": "SELECT Id, enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c " 
                    + "FROM enxCPQ__BundleElement__c WHERE enxCPQ__Bundle__r.Name IN (",
                "queryConditions": ")",
                "objectsList": bundleList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__BundleElement__c WHERE enxCPQ__Bundle__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

    
        const query: string = "SELECT Id, enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c FROM enxCPQ__BundleElement__c " 
            + "WHERE enxCPQ__Bundle__r.Name IN (" + Util.setToIdString(bundleList) + ")";
        const countQuery = "SELECT count(Id) FROM enxCPQ__BundleElement__c " 
            + "WHERE enxCPQ__Bundle__r.Name IN (" + Util.setToIdString(bundleList) + ")";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryBundleElementsByBundleTechIds(conn: Connection, bundleTechIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'bundle elements';

        if(bundleTechIds.size > 90){
            let paramsObject: Query = {
                "queryBegining": "SELECT Id, enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c, " + this.bundleElementQuery 
                    + " FROM enxCPQ__BundleElement__c WHERE enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": bundleTechIds,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__BundleElement__c WHERE enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query: string = "SELECT Id, enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c, " + this.bundleElementQuery 
            + " FROM enxCPQ__BundleElement__c WHERE enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(bundleTechIds) + ")";

        const countQuery = "SELECT count(Id) FROM enxCPQ__BundleElement__c WHERE enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(bundleTechIds) + ")";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryBundleElements(conn: Connection, bundleList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'bundle elements';

        if(bundleList.size > 90){
            let paramsObject: Query = {
                "queryBegining": "SELECT Id, enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c, " + this.bundleElementQuery 
                    + " FROM enxCPQ__BundleElement__c WHERE enxCPQ__Bundle__r.Name IN (",
                "queryConditions": ")",
                "objectsList": bundleList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__BundleElement__c WHERE enxCPQ__Bundle__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query: string = "SELECT Id, enxCPQ__Bundle__r.enxCPQ__TECH_External_Id__c, " + this.bundleElementQuery 
            + " FROM enxCPQ__BundleElement__c WHERE enxCPQ__Bundle__r.Name IN (" + Util.setToIdString(bundleList) + ")";
        const countQuery = "SELECT count(Id) FROM enxCPQ__BundleElement__c WHERE enxCPQ__Bundle__r.Name IN (" + Util.setToIdString(bundleList) + ")";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryBundleElementOptions(conn: Connection, bundleElementsTechIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'bundle element options';

        if(bundleElementsTechIds.size > 90){
            let paramsObject: Query = {
                "queryBegining": "SELECT Id, enxCPQ__Bundle_Element__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, " 
                    + this.bundleElementOptionQuery + " FROM enxCPQ__BundleElementOption__c WHERE enxCPQ__Bundle_Element__r.enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": bundleElementsTechIds,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__BundleElementOption__c WHERE enxCPQ__Bundle_Element__r.enxCPQ__TECH_External_Id__c IN (",
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query: string = "SELECT Id, enxCPQ__Bundle_Element__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "
            + this.bundleElementOptionQuery + " FROM enxCPQ__BundleElementOption__c WHERE enxCPQ__Bundle_Element__r.enxCPQ__TECH_External_Id__c IN (" 
            + Util.setToIdString(bundleElementsTechIds) + ")";

        const countQuery = "SELECT count(Id) FROM enxCPQ__BundleElementOption__c WHERE enxCPQ__Bundle_Element__r.enxCPQ__TECH_External_Id__c IN (" 
            + Util.setToIdString(bundleElementsTechIds) + ")"
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryBundleElementOptionsProductNames(conn: Connection, bundlesNames: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'bundle element options with product names';

        if(bundlesNames.size > 90){
            let paramsObject: Query = {
                "queryBegining": "SELECT Id, enxCPQ__Product__r.Name, enxCPQ__Product__r.enxCPQ__Root_Product__r.Name FROM enxCPQ__BundleElementOption__c "
                    +"WHERE enxCPQ__Bundle_Element__r.enxCPQ__Bundle__r.Name IN (",
                "queryConditions": ")",
                "objectsList": bundlesNames,
                "sObjectName": queriedObjectsLabel,
                "countQuery":  "SELECT count(Id) FROM enxCPQ__BundleElementOption__c "
                    +"WHERE enxCPQ__Bundle_Element__r.enxCPQ__Bundle__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query: string = "SELECT Id, enxCPQ__Product__r.Name, enxCPQ__Product__r.enxCPQ__Root_Product__r.Name FROM enxCPQ__BundleElementOption__c " 
            + "WHERE enxCPQ__Bundle_Element__r.enxCPQ__Bundle__r.Name IN (" + Util.setToIdString(bundlesNames) + ")";

        const countQuery = "SELECT count(Id) FROM enxCPQ__BundleElementOption__c " 
            + "WHERE enxCPQ__Bundle_Element__r.enxCPQ__Bundle__r.Name IN (" + Util.setToIdString(bundlesNames) + ")";

        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProductAttributeValues(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'product attribute values';
        if(productList.size >90){
            let paramsObject: Query={
                "queryBegining": "SELECT Id, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, "+ this.attrValuesQuery +" FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = false AND enxCPQ__Exclusive_for_Product__r.Name IN (",
                "queryConditions": ") ",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = false AND enxCPQ__Exclusive_for_Product__r.Name IN (",
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, "
            + this.attrValuesQuery +" FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = false AND enxCPQ__Exclusive_for_Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const countQuery = "SELECT count(Id) FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = false AND enxCPQ__Exclusive_for_Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryAttributeDefaultValues(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'attribute default values';
        if(productList.size >90){
            let paramsObject: Query={
                "queryBegining": "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrDefaultValuesQuery +" FROM enxCPQ__AttributeDefaultValue__c WHERE enxCPQ__Product__r.Name IN (",
                "queryConditions": ") ",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__AttributeDefaultValue__c WHERE enxCPQ__Product__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "
            + this.attrDefaultValuesQuery +" FROM enxCPQ__AttributeDefaultValue__c WHERE enxCPQ__Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const countQuery = "SELECT count(Id) FROM enxCPQ__AttributeDefaultValue__c WHERE enxCPQ__Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProductRelationships(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'product relationships';
        if(productList.size >90){
            let paramsObject: Query={
                "queryBegining": "SELECT Id, enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Secondary_Product__r.enxCPQ__TECH_External_Id__c, "+ this.productRelationshipsQuery+" FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (",
                "queryConditions": ") AND enxCPQ__Secondary_Product__c != null",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (",
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Secondary_Product__r.enxCPQ__TECH_External_Id__c, "
            + this.productRelationshipsQuery+" FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") AND enxCPQ__Secondary_Product__c != null";
        const countQuery = "SELECT count(Id) FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") AND enxCPQ__Secondary_Product__c != null";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async querySecondaryProducts(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'secondary Products';
        const query = "SELECT Id, enxCPQ__Secondary_Product__r.Name FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (" + Util.setToIdString(productList) + ") AND enxCPQ__Secondary_Product__c != null";

        if(productList.size >90){
            let paramsObject: Query={
                "queryBegining": "SELECT Id, enxCPQ__Secondary_Product__r.Name FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (",
                "queryConditions": ") AND enxCPQ__Secondary_Product__c != null",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const countQuery = "SELECT count(Id) FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (" + Util.setToIdString(productList) + ") AND enxCPQ__Secondary_Product__c != null";
        const numberOfRecords = await Util.countResults(conn, "standard PricebookEntry", countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryAttributeValueDependencies(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'attribute value dependency';
        if(productList.size >90){
            let paramsObject: Query={
                "queryBegining": "SELECT Id, enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c,  enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrValueDependecyQuery +" FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN (",
                "queryConditions": ") ",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c,  enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Product__r.enxCPQ__TECH_External_Id__c, "
            + this.attrValueDependecyQuery +" FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const countQuery = "SELECT count(Id) FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryMasterProductsOfAttributeValueDependencies(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'Master Products Of Attribute Value Dependencies';
        if(productList.size >90){
            let paramsObject: Query={
                "queryBegining": "SELECT Id, enxCPQ__Master_Product__r.Name, enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN (",
                "queryConditions": ") ",
                "objectsList": productList,
                "sObjectName": "Master Products Of Attribute Value Dependencies",
                "countQuery": "SELECT count(Id) FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        const query : string = "SELECT Id, enxCPQ__Master_Product__r.Name, enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const countQuery = "SELECT count(Id) FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN (" 
            + Util.setToIdString(productList) + ")";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }    
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryAttributeRules(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.log('--- exporting attribute rules ');
        const queriedObjectsLabel: string = 'attribute rules';
        if(productList.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.Name, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrRulesQuery +" FROM enxCPQ__AttributeRule__c WHERE enxCPQ__Product__r.Name IN (",
                "queryConditions": ") ",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__AttributeRule__c WHERE enxCPQ__Product__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.Name, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "
            + this.attrRulesQuery +" FROM enxCPQ__AttributeRule__c WHERE enxCPQ__Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const countQuery = "SELECT count(Id) FROM enxCPQ__AttributeRule__c WHERE enxCPQ__Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProvisioningPlanAssigns(conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'provisioning plan assignments';
        if(productList.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxB2B__Product__r.enxCPQ__TECH_External_Id__c, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, "+ this.prvPlanAssignmentQuery +" FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.Name IN (",
                "queryConditions": ") ",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxB2B__Product__r.enxCPQ__TECH_External_Id__c, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, "
            + this.prvPlanAssignmentQuery +" FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") ";
        const countQuery = "SELECT count(Id) FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.Name IN (" 
            + Util.setToIdString(productList) + ")";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryCategories(conn: Connection, categoryIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'categories';
        if(categoryIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Parameter_Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Category__r.enxCPQ__TECH_External_Id__c, " + this.categoryQuery +" FROM enxCPQ__Category__c WHERE enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": categoryIds,
                "sObjectName": queriedObjectsLabel,          
                "countQuery": "SELECT count(Id) FROM enxCPQ__Category__c WHERE enxCPQ__TECH_External_Id__c IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        if(categoryIds.size ===0){
            return[];
        }

        const query = "SELECT Id, enxCPQ__Parameter_Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Category__r.enxCPQ__TECH_External_Id__c, " 
            + this.categoryQuery +" FROM enxCPQ__Category__c WHERE enxCPQ__TECH_External_Id__c IN (" 
            + Util.setToIdString(categoryIds) + ") ";
        const countQuery = "SELECT count(Id) FROM enxCPQ__Category__c WHERE enxCPQ__TECH_External_Id__c IN (" 
            + Util.setToIdString(categoryIds) + ") ";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryAttributeValues(conn: Connection, attributeIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'attribute values';
        if(attributeIds.size === 0){
            return[];
        }
        if(attributeIds.size >90){

            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, "+ this.attrValuesQuery+" FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ") ",
                "objectsList": attributeIds,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, "
            + this.attrValuesQuery+" FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN (" 
            + Util.setToIdString(attributeIds) + ") ";
        const countQuery = "SELECT count(Id) FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN (" 
            + Util.setToIdString(attributeIds) + ")";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryAttributeSets(conn: Connection, attributeSetIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'attributes sets';
        if(attributeSetIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, "+ this.attrSetQuery+" FROM enxCPQ__AttributeSet__c WHERE enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": attributeSetIds,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxCPQ__AttributeSet__c WHERE enxCPQ__TECH_External_Id__c IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, "+ this.attrSetQuery+" FROM enxCPQ__AttributeSet__c WHERE enxCPQ__TECH_External_Id__c IN (" 
            + Util.setToIdString(attributeSetIds) + ") ";
        const countQuery = "SELECT count(Id) FROM enxCPQ__AttributeSet__c WHERE enxCPQ__TECH_External_Id__c IN (" 
            + Util.setToIdString(attributeSetIds) + ") ";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProvisioningPlanAssignmentIds (conn: Connection, sourceProductIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'Provisioning Plan Assignment Ids';
        if(sourceProductIds.size === 0){
            return[];
        }
        if(sourceProductIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": sourceProductIds,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.enxCPQ__TECH_External_Id__c IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query ="SELECT Id, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.enxCPQ__TECH_External_Id__c IN (" 
            + Util.setToIdString(sourceProductIds) + ")";
        const countQuery = "SELECT count(Id) FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.enxCPQ__TECH_External_Id__c IN (" 
            + Util.setToIdString(sourceProductIds) + ")";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProvisioningTaskAssignmentIds (conn: Connection, prvPlanIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'provisioning task assigment ids';
        if(prvPlanIds.size === 0){
            return[];
        }
        if(prvPlanIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id FROM enxB2B__ProvisioningTaskAssignment__c WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (",
                "queryConditions": ")",
                "objectsList": prvPlanIds,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxB2B__ProvisioningTaskAssignment__c WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id FROM enxB2B__ProvisioningTaskAssignment__c WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (" 
            + Util.setToIdString(prvPlanIds) + ")";
        const countQuery = "SELECT count(Id) FROM enxB2B__ProvisioningTaskAssignment__c WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (" 
            + Util.setToIdString(prvPlanIds) + ")";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryProvisioningTaskAssignments (conn: Connection, prvPlanIds: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'Provisioning task assignments';
        if(prvPlanIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, enxB2B__Provisioning_Task__r.enxB2B__TECH_External_Id__c, "+ this.prvTaskAssignmentQuery +" FROM enxB2B__ProvisioningTaskAssignment__c  WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (",
                "queryConditions": ")",
                "objectsList": prvPlanIds,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM enxB2B__ProvisioningTaskAssignment__c  WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  ("
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        const query = "SELECT Id, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, enxB2B__Provisioning_Task__r.enxB2B__TECH_External_Id__c, "
            + this.prvTaskAssignmentQuery +" FROM enxB2B__ProvisioningTaskAssignment__c  WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (" 
            + Util.setToIdString(prvPlanIds) + ")";
        const countQuery = "SELECT count(Id) FROM enxB2B__ProvisioningTaskAssignment__c  WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (" 
            + Util.setToIdString(prvPlanIds) + ")";;
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryChargeElementStdPricebookEntries (conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'Charge Elements standard PricebookEntry';
        if(productList.size >90){
 
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery +" FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name = 'Charge Element'",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN ("
            }
            if(this.currencies){
                paramsObject['queryConditions'] =  paramsObject['queryConditions'] + " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") ";
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }

        let query = "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery +
         " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + 
        ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name = 'Charge Element'";
       
        let countQuery = "SELECT count(Id) FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + 
            ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name = 'Charge Element'";
        if(this.currencies){
            const extraCondition = " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") ";
            query= query+ extraCondition;
            countQuery = countQuery + extraCondition;
        }
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
     
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);   
    }

    public static async queryChargeElementPricebookEntries (conn: Connection, productList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'Charge Element Pricebook Entries';
        if(productList.size >90){

           let paramsObject: Query={     
                "queryBegining": "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND Pricebook2.IsStandard = false AND Product2.RecordType.Name = 'Charge Element'",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN ("
            }
            if(this.currencies){
                paramsObject['queryConditions'] =  paramsObject['queryConditions'] + " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") "
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        let query = "SELECT Id, Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + 
        " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) +
         ") AND Pricebook2.IsStandard = false AND Product2.RecordType.Name = 'Charge Element'";
         let countQuery = "SELECT count(Id) FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) +
          ") AND Pricebook2.IsStandard = false AND Product2.RecordType.Name = 'Charge Element'";
        if(this.currencies){
            const extraCondition = " AND CurrencyIsoCode IN (" + Util.setToIdString(this.currencies) + ") ";
            query=query + extraCondition;
            countQuery = countQuery + extraCondition;
        }

        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }

        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryChargeElements (conn: Connection, productList: Set<String>, chargeList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'Charge Elements';
        if(productList.size + chargeList.size>90){
            let paramsObject1: Query={
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND RecordType.Name = 'Charge Element'",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN ("
            }
            let paramsObject2: Query={
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND RecordType.Name = 'Charge Element'",
                "objectsList": chargeList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }

        const query = "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "
            +this.productQuery+" FROM Product2 WHERE (enxCPQ__Root_Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") or enxCPQ__Root_Product__r.Name IN (" 
            + Util.setToIdString(chargeList) + ")) AND RecordType.Name = 'Charge Element'";
        const countQuery = "SELECT count(Id) FROM Product2 WHERE (enxCPQ__Root_Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") or enxCPQ__Root_Product__r.Name IN (" 
            + Util.setToIdString(chargeList) + ")) AND RecordType.Name = 'Charge Element'";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);

        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async queryChargeTiers (conn: Connection,  productList: Set<String>, chargeList: Set<String>): Promise<String[]> {
        const queriedObjectsLabel: string = 'charge tier';
        if(productList.size + chargeList.size>90){
            let paramsObject1: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND RecordType.Name = 'Charge Tier'",
                "objectsList": productList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN ("
            }
            let paramsObject2: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND RecordType.Name = 'Charge Tier'",
                "objectsList": chargeList,
                "sObjectName": queriedObjectsLabel,
                "countQuery": "SELECT count(Id) FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN ("
            }
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }

        const query = "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "
            +this.productQuery+" FROM Product2 WHERE (enxCPQ__Root_Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") or enxCPQ__Root_Product__r.Name IN (" 
            + Util.setToIdString(chargeList) + ")) AND RecordType.Name = 'Charge Tier'";
        const countQuery = "SELECT count(Id) FROM Product2 WHERE (enxCPQ__Root_Product__r.Name IN (" 
            + Util.setToIdString(productList) + ") or enxCPQ__Root_Product__r.Name IN (" 
            + Util.setToIdString(chargeList) + ")) AND RecordType.Name = 'Charge Tier'";
        const numberOfRecords = await Util.countResults(conn, queriedObjectsLabel, countQuery);
        
        if(numberOfRecords >40000){
            return await Util.useQueryPromiseArray(query, numberOfRecords, conn, queriedObjectsLabel)
        }
        return await this.genericRestQuery(conn, query, queriedObjectsLabel);
    }

    public static async genericRestQuery(conn: Connection, query: string, queriedObjectsLabel: string ) : Promise<String[]> {
        Util.log('--- exporting ' + queriedObjectsLabel);
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            conn.query(query,
            null,
            (err, res) => {
                if (err) reject('error retrieving:' + queriedObjectsLabel +  ' + err');
                if (res.records.length < 200){
                    Util.log("--- "+queriedObjectsLabel+": " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });
        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await Util.createBulkQuery(conn, query, queriedObjectsLabel);
            }else{
                return result;
            }
        });
    }
}