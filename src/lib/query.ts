import { Connection } from 'jsforce';
import { Util } from './Util';
import {Query} from  '../entity/queryEntity';
export class Queries {
    private static productQuery: string;
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

    public static setIsRelated(isRelated: boolean){
        this.isRelated = isRelated;
    }

    public static async retrieveQueryJson(queryDir: string){
       let queryJson = await Util.readQueryJson(queryDir);
       this.productQuery= queryJson['productFieldNames'];
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
        Util.log('--- querying all Product Names');
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Name FROM Product2 WHERE RecordType.Name = 'Product' OR RecordType.Name = 'Bundle'", 
        null,
        function (err, res) {
            if (err) reject('error querying all Product Names: ' + err);
            if (res.records.length < 200){
               Util.log("--- all Product Names: " + res.records.length);
               resolve(res.records);
            }else{
               resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryAllProductNames(conn);
        }else{
            return result;
        }
      }
    );
    }

public static async bulkQueryAllProductNames(conn: Connection):  Promise<String[]> {
        Util.showSpinner('---bulk exporting all Product Names');
        let query = "SELECT Name FROM Product2 WHERE RecordType.Name = 'Product' OR RecordType.Name = 'Bundle'";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving all Product Names ' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('all Product Names export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryRecordTypes(conn: Connection): Promise<String[]> {
        Util.log('--- exporting record Types');
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Id, Name, DeveloperName, SObjectType FROM RecordType", 
        null,
        function (err, res) {
            if (err) reject('error retrieving record types: ' + err);
            Util.log("--- record types: " + res.records.length);
            resolve(res.records);
        });
    })
    }

public static async queryStdPricebookEntryIds(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.log('--- exporting standard Pricebook Entry Ids');
        if(productList.size >90){
            let paramsObject1: Query={     
                "queryBegining": "SELECT Id FROM PricebookEntry WHERE Product2.Name IN (",
                "queryConditions": ") AND Pricebook2Id != null AND Pricebook2.IsStandard = true",
                "objectsList": productList,
                "sobjectName": "standard Pricebook Entry Ids"
            }
            let paramsObject2: Query={     
                "queryBegining": "SELECT Id FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND Pricebook2Id != null AND Pricebook2.IsStandard = true",
                "objectsList": productList,
                "sobjectName": "standard Pricebook Entry Ids"
            }
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Id FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ")) AND Pricebook2Id != null AND Pricebook2.IsStandard = true", 
            null,
            function (err, res) {
                if (err) { 
                    reject('error retrieving standard Pricebook Entry Ids: ' + err);
                    return;
                }if (res.records.length < 200){   
                     Util.log("--- standard Pricebook Entry Ids: " + res.records.length);
                     resolve(res.records);
                }else{
                     resolve(["useBulkApi"]);
                }
            });
        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryStdPricebookEntryIds(conn, productList);
            }else{
                return result;
            }
          }
        );
        }
        public static async bulkQueryStdPricebookEntryIds (conn: Connection, productList: Set<String>): Promise<String[]> {
            Util.showSpinner('---bulk exporting standard PricebookEntry ids');
            let query = "SELECT Id FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ")) AND Pricebook2Id != null AND Pricebook2.IsStandard = true";
            return new Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving standard PricebookEntry ids ' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner(' standard PricebookEntry ids export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }
public static async queryPricebookEntryIds(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.log('--- exporting standard Pricebook Entry Ids');
        if(productList.size >90){
            let paramsObject1: Query={     
                "queryBegining": "SELECT Id FROM PricebookEntry WHERE Product2.Name IN (",
                "queryConditions": ") AND Pricebook2Id != null AND Pricebook2.IsStandard = false",
                "objectsList": productList,
                "sobjectName": "Pricebook Entry Ids"
            }
            let paramsObject2: Query={     
                "queryBegining": "SELECT Id FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND Pricebook2Id != null AND Pricebook2.IsStandard = false",
                "objectsList": productList,
                "sobjectName": "Pricebook Entry Ids"
            }
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }
        Util.log('--- exporting Pricebook Entry Ids');
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            conn.query("SELECT Id FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ")) AND Pricebook2Id != null AND Pricebook2.IsStandard = false",
            null,
            function (err, res) {
                if (err) { 
                    reject('error retrieving Pricebook Entry Ids: ' + err);
                    return;
                }
                if (res.records.length < 200){
                Util.log("--- Pricebook Entry Ids: " + res.records.length);
                resolve(res.records);
            }else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryPricebookEntryIds(conn, productList);
        }else{
            return result;
        }
      }
    );
    }

public static async bulkQueryPricebookEntryIds (conn: Connection, productList: Set<String>): Promise<String[]> {
         Util.showSpinner('---bulk exporting PricebookEntry ids');
         let query = "SELECT Id FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ")) AND Pricebook2Id != null AND Pricebook2.IsStandard = false";
         return new Promise<String[]>((resolve: Function, reject: Function) => {
         let records = []; 
         conn.bulk.query(query)
             .on('record', function(rec) { 
                 records.push(rec);
             })
             .on('error', function(err) { 
                 reject(err); 
             })
             .on('end', function(info) { 
                 Util.hideSpinner('PricebookEntry ids export done. Retrieved: '+ records.length);
                 Util.sanitizeResult(records);
                 resolve(records); 
             });
        })
    
    }

public static async queryProductAttributeIds(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.log('--- exporting product attribute ids');
        if(productList.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (",
                "queryConditions": ")",
                "objectsList": productList,
                "sobjectName": "product attribute ids"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Id FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ")", 
        null,
        function (err, res) {
            if (err) reject('error retrieving product attribute ids: ' + err);
            if (res.records.length < 200){
                Util.log("--- product attribute ids: " + res.records.length);
                resolve(res.records);
            }else{
                resolve(["useBulkApi"]);
            }
        });
       }).then(async result =>{
          if(result[0] === 'useBulkApi'){
              return await this.bulkQueryProductAttributeIds(conn, productList);
          }else{
              return result;
          }
        }
      );
}

public static async bulkQueryProductAttributeIds (conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting product attribute ids');
    let query ="SELECT Id FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ")";
    return new Promise<String[]>((resolve: Function, reject: Function) => {
    let records = []; 
    conn.bulk.query(query)
        .on('record', function(rec) { 
            records.push(rec);
        })
        .on('error', function(err) { 
            reject(err); 
        })
        .on('end', function(info) { 
            Util.hideSpinner('product attribute ids export done. Retrieved: '+ records.length);
            Util.sanitizeResult(records);
            resolve(records); 
        });
   })
}

public static async queryPricebooksIds(conn: Connection): Promise<String[]> {
        Util.log('--- exporting  pricebook ids');
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Id, enxCPQ__TECH_External_Id__c, IsStandard FROM Pricebook2", 
        null,
        function (err, res) {
            if (err) reject('error retrieving pricebook ids: ' + err);
            if (res.records.length < 200){
                Util.log("--- pricebooks ids: " + res.records.length);
                resolve(res.records);
            }else{
                resolve(["useBulkApi"]);
            }
       });
     }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryPricebooksIds(conn);
        }else{
            return result;
        }
      }
    );
}

public static async bulkQueryPricebooksIds (conn: Connection): Promise<String[]> {
    Util.showSpinner('---bulk exporting pricebook ids');
    let query ="SELECT Id, enxCPQ__TECH_External_Id__c, IsStandard FROM Pricebook2";
    return new Promise<String[]>((resolve: Function, reject: Function) => {
    let records = []; 
    conn.bulk.query(query)
        .on('record', function(rec) { 
            records.push(rec);
        })
        .on('error', function(err) { 
            reject(err); 
        })
        .on('end', function(info) { 
            Util.hideSpinner('pricebook ids export done. Retrieved: '+ records.length);
            Util.sanitizeResult(records);
            resolve(records); 
        });
   })
}

public static async queryProductIds(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.log('--- exporting product ids');
    if(productList.size >90){
        let paramsObject1: Query={
            "queryBegining":"SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE Name IN (",
            "queryConditions": ")",
            "objectsList": productList,
            "sobjectName": "product ids"
        }
        let paramsObject2: Query={
            "queryBegining":"SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN (",
            "queryConditions": ")",
            "objectsList": productList,
            "sobjectName": "product ids"
        }
        return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
    }
    return new Promise<String[]>((resolve: Function, reject: Function) => {
    conn.query("SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE (Name IN (" + Util.setToIdString(productList) + ") OR enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + "))",
    null,
    function (err, res) {
        if (err) reject('error retrieving product ids: ' + err);
        if (res.records.length < 200){
            Util.log("--- product ids: " + res.records.length);
            resolve(res.records);
        }else{
            resolve(["useBulkApi"]);
        }
    });
  }).then(async result =>{
      if(result[0] === 'useBulkApi'){
          return await this.bulkQueryProductIds(conn, productList);
      }else{
          return result;
      }
    }
  );
}

public static async bulkQueryProductIds (conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting product ids');
    let query = "SELECT Id, enxCPQ__TECH_External_Id__c FROM Product2 WHERE (Name IN (" + Util.setToIdString(productList) + ") OR enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + "))";
    return new Promise<String[]>((resolve: Function, reject: Function) => {
    let records = []; 
    conn.bulk.query(query)
        .on('record', function(rec) { 
            records.push(rec);
        })
        .on('error', function(err) { 
            reject('error retrieving product ids ' + err); 
        })
        .on('end', function(info) { 
            Util.hideSpinner('product ids export done. Retrieved: '+ records.length);
            Util.sanitizeResult(records);
            resolve(records);
        });
})
}

public static async queryStdPricebookEntries(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.log('--- exporting standard PricebookEntry');
        if(productList.size >90){
            let paramsObject1: Query={     
                "queryBegining": "SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.Name IN (",
                "queryConditions": ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name != 'Charge Element'",
                "objectsList": productList,
                "sobjectName": "standard PricebookEntry"
            }
            let paramsObject2: Query={     
                "queryBegining": "SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name != 'Charge Element'",
                "objectsList": productList,
                "sobjectName": "standard PricebookEntry"
            }
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ")) AND Pricebook2.IsStandard = true AND Product2.RecordType.Name != 'Charge Element'", 
        null,
        function (err, res) {
            if (err) reject('error retrieving standard pricebook entries: ' + err);
            if (res.records.length < 200){
                Util.log("--- standard pricebook entries: " + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryStdPricebookEntries(conn, productList);
        }else{
            return result;
        }
      }
    );
  }
  
public static async bulkQueryStdPricebookEntries(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting standard PricebookEntry');
    let query = "SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ")) AND Pricebook2.IsStandard = true AND Product2.RecordType.Name != 'Charge Element'";
   return new  Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving standard PricebookEntry' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner('standard PricebookEntry export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}

public static async queryPricebookEntryCurrencies(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.log('--- exporting  pricebook entry currencies');
    if(productList.size >90){
        let paramsObject1: Query={
            "queryBegining": "SELECT Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode FROM PricebookEntry WHERE Product2.Name IN (",
            "queryConditions": ")",
            "objectsList": productList,
            "sobjectName": "pricebook entry currencies"
        }
        let paramsObject2: Query={
            "queryBegining": "SELECT Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
            "queryConditions": ")",
            "objectsList": productList,
            "sobjectName": "pricebook entry currencies"
        }
        return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
    }
    return new Promise<String[]>((resolve: Function, reject: Function) => {
    conn.query("SELECT Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + "))", 
    null,
    function (err, res) {
        if (err) reject('error retrieving pricebook entry currencies: ' + err);
        if(res.records.length < 200){
           Util.log("--- pricebook entry currencies: " + res.records.length);
           resolve(res.records);
        }else{
            resolve(["useBulkApi"]);
        }
    });
}).then(async result =>{
    if(result[0] === 'useBulkApi'){
        return await this.bulkQueryPricebookEntryCurrencies(conn, productList);
    }else{
        return result;
    }
  }
 );
}

public static async bulkQueryPricebookEntryCurrencies(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting pricebook entry currencies');
    let query = "SELECT Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + "))";
    return new  Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving pricebook entry currencies' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner('pricebook entry currencies export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}

public static async queryPricebooks(conn: Connection): Promise<String[]> {
        Util.log('--- exporting pricebooks');
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Id, IsStandard, "+ this.pricebookQuery+" FROM Pricebook2 WHERE IsActive = true OR IsStandard = true", 
        null,
        function (err, res) {
            if (err) reject('error retrieving pricebooks: ' + err);
            if(res.records.length < 200){
               Util.log("--- pricebooks: " + res.records.length);
               resolve(res.records);
            }else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryPricebooks(conn);
        }else{
            return result;
        }
      }
     );
    }

public static async bulkQueryPricebooks(conn: Connection): Promise<String[]> {
        Util.showSpinner('---bulk exporting pricebooks');
        let query = "SELECT IsStandard, "+ this.pricebookQuery+" FROM Pricebook2 WHERE IsActive = true OR IsStandard = true";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving pricebooks ' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('pricebooks export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryPricebookEntries(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.log('--- exporting PricebookEntry');
        if(productList.size >90){
            let paramsObject1: Query={     
                "queryBegining": "SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.Name IN (",
                "queryConditions": ") AND Pricebook2.IsStandard = false AND Product2.RecordType.Name != 'Charge Element'",
                "objectsList": productList,
                "sobjectName": "standard PricebookEntry"
            }
            let paramsObject2: Query={     
                "queryBegining": "SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND Pricebook2.IsStandard = false AND Product2.RecordType.Name != 'Charge Element'",
                "objectsList": productList,
                "sobjectName": "standard PricebookEntry"
            }
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id, " + this.pbeQuery + " FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ")) AND Pricebook2.IsStandard = false AND Product2.RecordType.Name != 'Charge Element'", 
        null,
        function (err, res) {
            if (err) reject('error retrieving pricebook entries: ' + err);
            if (res.records.length < 200){
                Util.log("--- pricebook entries: " + res.records.length);
                resolve(res.records)
            }else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryPricebookEntries(conn, productList);
        }else{
            return result;
        }
      }
     );
    }

public static async bulkQueryPricebookEntries(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting PricebookEntry');
        let query = "SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id, " + this.pbeQuery + " FROM PricebookEntry WHERE (Product2.Name IN (" + Util.setToIdString(productList) + ") OR Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ")) AND Pricebook2.IsStandard = false AND Product2.RecordType.Name != 'Charge Element'";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving PricebookEntry' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('PricebookEntry export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryProduct(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.log('--- exporting product');

    if(productList.size >30){
        let paramsObject: Query={
            "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE Name IN (",
            "queryConditions": ")",
            "objectsList": productList,
            "sobjectName": "product"
        }
        return await Util.createQueryPromiseArray(paramsObject, conn);

       
    }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            conn.query("SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE Name IN (" + Util.setToIdString(productList) + ")", 
            null,
            function (err, res) {
                if (err) {reject('Failed to retrieve product: ' + productList + '. Error: ' + err)};
                if(res.records.length === 0) {reject('Failed to retrieve products. Check if every product exist on source env')};
                if (res.records.length < 200){
                    Util.log("--- product: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });
        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryProduct(conn, productList);
            }else{
                return result;
            }
          }
        );
    }
  

public static async bulkQueryProduct(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting product');
        let query = "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE Name IN (" + Util.setToIdString(productList) + ")";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving product' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('product export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }



public static async queryProductAttributes(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.log('--- exporting product attributes ');
    if(productList.size >90){
        let paramsObject: Query={
            "queryBegining": "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.Name, enxCPQ__Value_Attribute__r.enxCPQ__TECH_External_Id__c,  enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, " + this.productAttrQuery + " FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (",
            "queryConditions": ") ORDER BY enxCPQ__Order__c",
            "objectsList": productList,
            "sobjectName": "product attributes"
        }
        return await Util.createQueryPromiseArray(paramsObject, conn);
    }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            conn.query("SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.Name, enxCPQ__Value_Attribute__r.enxCPQ__TECH_External_Id__c,  enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, " + this.productAttrQuery + " FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve product attributes:  Error: ' + err);
                if (res.records.length < 200){
                    Util.log("--- product attributes: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });
        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryProductAttributes(conn, productList);
            }else{
                return result;
            }
          }
        );
    }

public static async bulkQueryProductAttributes(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting product attributes');
        let query = "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.Name, enxCPQ__Value_Attribute__r.enxCPQ__TECH_External_Id__c,  enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c," + this.productAttrQuery + " FROM enxCPQ__ProductAttribute__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__Order__c";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving product attributes' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('product attributes export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryProductOptions(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.log('--- exporting product options ');
        if(productList.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+ " FROM Product2 WHERE RecordType.Name = 'Option' AND enxCPQ__Parent_Product__r.Name IN (",
                "queryConditions": ") ORDER BY enxCPQ__Sorting_Order__c",
                "objectsList": productList,
                "sobjectName": "product options"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            conn.query("SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+ " FROM Product2 WHERE RecordType.Name = 'Option' AND enxCPQ__Parent_Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__Sorting_Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve options. Error: ' + err);
                if (res.records.length < 200){
                    Util.log("--- options: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });
        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryProductOptions(conn, productList);
            }else{
                return result;
            }
         }
        );
    }

public static async bulkQueryProductOptions(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting product options');
        let query = "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+ " FROM Product2 WHERE RecordType.Name = 'Option' AND enxCPQ__Parent_Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__Sorting_Order__c";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving options' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('product options export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryAttributeSetAttributes(conn: Connection, attributeSetIds: Set<String>): Promise<String[]> {
        Util.log('--- exporting attributes set attributes ');
        if(attributeSetIds.size === 0){
            return[];
        }
        if(attributeSetIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, "+ this.attrSetAttrQuery +" FROM enxCPQ__AttributeSetAttribute__c WHERE enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ") ORDER BY enxCPQ__Order__c",
                "objectsList": attributeSetIds,
                "sobjectName": "attributes set attributes"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            conn.query("SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, "+ this.attrSetAttrQuery +
                " FROM enxCPQ__AttributeSetAttribute__c WHERE enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeSetIds) + ") ORDER BY enxCPQ__Order__c", 

            null,
            function (err, res) {
                if (err) reject('Failed to retrieve attribute set attributes. Error: ' + err);
                if (res.records.length < 200){
                    Util.log("--- attribute set attributes: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });

        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryAttributeSetAttributes(conn, attributeSetIds);
            }else{
                return result;
            }
      }
  );
    }

public static async bulkQueryAttributeSetAttributes(conn: Connection, attributeSetIds: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting attributes set attributes');
        let query = "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c, "+ this.attrSetAttrQuery +
            " FROM enxCPQ__AttributeSetAttribute__c WHERE enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeSetIds) + ") ORDER BY enxCPQ__Order__c";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving attribute set attributes' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('attributes set attributes export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryAttributes(conn: Connection, attributeIds: Set<String>): Promise<String[]> {
        Util.log('--- exporting attributes');
        if(attributeIds.size === 0){
            return[];
        }
        if(attributeIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, "+ this.attrQuery +" FROM enxCPQ__Attribute__c WHERE enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": attributeIds,
                "sobjectName": "attributes"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {

            conn.query("SELECT Id, "+ this.attrQuery +" FROM enxCPQ__Attribute__c WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeIds) + ") ", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve attributes. Error: ' + err);
                if (res.records.length < 200){
                    Util.log("--- attributes: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });
        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryAttributes(conn, attributeIds);
            }else{
                return result;
            }
      }
  );
}

public static async bulkQueryAttributes(conn: Connection, attributeIds: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting attributes');
        let query = "SELECT Id, "+ this.attrQuery +" FROM enxCPQ__Attribute__c WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeIds) + ") ";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving attributes' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('attributes export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryProvisioningTasks(conn: Connection, provisioningTaskIds: Set<String>): Promise<String[]> {
        Util.log('--- exporting provisioning tasks ');
        if(provisioningTaskIds.size === 0){
            return[];
        }
        if(provisioningTaskIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, "+ this.prvTaskQuery+" FROM enxB2B__ProvisioningTask__c WHERE enxB2B__TECH_External_Id__c IN  (",
                "queryConditions": ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name != 'Charge Element'",
                "objectsList": provisioningTaskIds,
                "sobjectName": "provisioning tasks"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
    return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Id, "+ this.prvTaskQuery+" FROM enxB2B__ProvisioningTask__c WHERE enxB2B__TECH_External_Id__c IN  (" + Util.setToIdString(provisioningTaskIds) + ")",null, function(err, res) {
            if (err) reject('error retrieving provisioning tasks: ' + err);
            if(res.records.length<200){
                Util.log('---provisioning tasks: ' + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
        });
        }).then(async result =>{
          if(result[0] === 'useBulkApi'){
              return await this.bulkQueryProvisioningTasks(conn, provisioningTaskIds);
          }else{
            return result;
        }
        }
       );
     }

public static async bulkQueryProvisioningTasks(conn: Connection, provisioningTaskIds: Set<String>): Promise<String[]> {
    Util.showSpinner('--- bulk exporting provisioning tasks');
    let query = "SELECT Id, "+ this.prvTaskQuery+" FROM enxB2B__ProvisioningTask__c WHERE enxB2B__TECH_External_Id__c IN  (" + Util.setToIdString(provisioningTaskIds) + ")";
    return new Promise<string[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) {  
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving provisioning tasks ' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner('provisioning tasks export done. Retrieved: ' + records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}

public static async queryProvisioningPlans(conn: Connection, provisioningPlanIds: Set<String>): Promise<String[]> {
        Util.log('--- exporting provisioning plans');
        if(provisioningPlanIds.size === 0){
            return[];
        }
        if(provisioningPlanIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, "+ this.prvPlanQuery+" FROM enxB2B__ProvisioningPlan__c WHERE enxB2B__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": provisioningPlanIds,
                "sobjectName": "provisioning plans"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Id, "+ this.prvPlanQuery+" FROM enxB2B__ProvisioningPlan__c WHERE enxB2B__TECH_External_Id__c IN (" + Util.setToIdString(provisioningPlanIds) + ")", null, function(err, res) {
            if (err) reject('error retrieving provisioning plans: ' + err);
            if (res.records.length < 200){
                Util.log("--- provisioning plans: " + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryProvisioningPlans(conn, provisioningPlanIds);
        }else{
            return result;
        }
      }
   );
 }

public static async bulkQueryProvisioningPlans(conn: Connection, provisioningPlanIds: Set<String>): Promise<String[]> {
    Util.showSpinner('--- bulk exporting provisioning plans');
    let query = "SELECT Id, "+ this.prvPlanQuery+" FROM enxB2B__ProvisioningPlan__c WHERE enxB2B__TECH_External_Id__c IN (" + Util.setToIdString(provisioningPlanIds) + ")";
    return new  Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving provisioning plans' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner('provisioning plans export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}
public static async  queryProductCharges(conn: Connection, productList: Set<String>): Promise<String[]> {
         Util.log('--- exporting product charges ');
         let query = this.isRelated 
                    ?"SELECT enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, "
                    :"SELECT ";
         query = query + "Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE RecordType.Name = 'Charge' AND (enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ") OR enxCPQ__Charge_Reference__c !=null)  ORDER BY enxCPQ__Sorting_Order__c";
         if(productList.size >90){
            let  paramsObject={
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE RecordType.Name = 'Charge' AND (enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") OR enxCPQ__Charge_Reference__c !=null)  ORDER BY enxCPQ__Sorting_Order__c",
                "objectsList": productList,
                "sobjectName": "product charges"
             }
            if(this.isRelated ){
                paramsObject.queryBegining = "SELECT enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE RecordType.Name = 'Charge' AND (enxCPQ__Root_Product__r.Name IN (";
            }
            
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
         return new Promise<String[]>((resolve: Function, reject: Function) => {
         conn.query(query, 
         null,
         function (err, res) {
            if (err) reject('Failed to retrieve charges error: ' + err);
            Util.log('fin charges');
            if (res.records.length < 200){
                Util.log("--- charges: " + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryProductCharges(conn, query);
        }else{
            return result;
        }
     }
    );
}

public static async  bulkQueryProductCharges(conn: Connection,  query: string): Promise<String[]> {
    Util.showSpinner('--- bulk exporting product charges');
    return new  Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving product charges' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner('product reference charges export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}

public static async queryReferenceCharges(conn: Connection, chargeList: Set<String>): Promise<String[]> {
    Util.log('--- exporting reference charges ');
    let query = "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(chargeList) + ") ORDER BY enxCPQ__Sorting_Order__c";
    
    if(chargeList.size >90){
        let paramsObject: Query={
            "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__TECH_External_Id__c IN (",
            "queryConditions": ") ORDER BY enxCPQ__Sorting_Order__c",
            "objectsList": chargeList,
            "sobjectName": "reference charges"
        }
        return await Util.createQueryPromiseArray(paramsObject, conn);
    }

    return new Promise<String[]>((resolve: Function, reject: Function) => {
    conn.query(query, 
    null,
    function (err, res) {
       if (err) reject('Failed to retrieve reference charges: ' + err);
       Util.log('fin reference charges');
       if (res.records.length < 200){
           Util.log("--- reference charges: " + res.records.length);
           resolve(res.records);
       }
       else{
           resolve(["useBulkApi"]);
       }
   });
}).then(async result =>{
   if(result[0] === 'useBulkApi'){
       return await this.bulkQueryProductCharges(conn, query);
   }else{
       return result;
   }
}
);
}

public static async  bulkQueryReferenceCharges(conn: Connection,  query: string): Promise<String[]> {
Util.showSpinner('--- bulk exporting reference charges');
return new  Promise<String[]>((resolve: Function, reject: Function) => {
   let records = []; 
   conn.bulk.query(query)
       .on('record', function(rec) { 
           records.push(rec);
       })
       .on('error', function(err) { 
           reject('error retrieving reference charges' + err);  
       })
       .on('end', function(info) { 
           Util.hideSpinner('reference charges export done. Retrieved: '+ records.length);
           Util.sanitizeResult(records);
           resolve(records); 
       });
})
}

public static async queryProductChargesIds(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.log('--- exporting product charges ids');
    if(productList.size >90){
        let paramsObject: Query={
            "queryBegining": "SELECT enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__Root_Product__r.Name IN (",
            "queryConditions": ") ORDER BY enxCPQ__Sorting_Order__c",
            "objectsList": productList,
            "sobjectName": "product charges ids"
        }
        return await Util.createQueryPromiseArray(paramsObject, conn);
    }
    return new Promise<String[]>((resolve: Function, reject: Function) => {

    conn.query("SELECT enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__Sorting_Order__c", 
    null,
    function (err, res) {
       if (err) reject('Failed to retrieve charges ids. Error: ' + err);
       if (res.records.length < 200){
        Util.log("--- product charges ids: " + res.records.length);
        resolve(res.records);
    }
    else{
        resolve(["useBulkApi"]);
    }
   });
}).then(async result =>{
          if(result[0] === 'useBulkApi'){
              return await this.bulkQueryProductChargesIds(conn, productList);
          }else{
            return result;
        }
    }
  );
}
public static async bulkQueryProductChargesIds(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting product charges ids');
    let query = "SELECT enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c FROM Product2 WHERE RecordType.Name = 'Charge' AND enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__Sorting_Order__c";
    return new  Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving product charges ids' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner('product charges ids export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}

public static async queryProductAttributeValues(conn: Connection, productList: Set<String>): Promise<String[]> {
       Util.log('--- exporting product attribute values ');
       if(productList.size >90){
        let paramsObject: Query={
            "queryBegining": "SELECT Id, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, "+ this.attrValuesQuery +" FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = false AND enxCPQ__Exclusive_for_Product__r.Name IN (",
            "queryConditions": ") ORDER BY enxCPQ__Order__c",
            "objectsList": productList,
            "sobjectName": "product attribute values"
        }
        return await Util.createQueryPromiseArray(paramsObject, conn);
    }
       return new Promise<String[]>((resolve: Function, reject: Function) => {

           conn.query("SELECT Id, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, "+ this.attrValuesQuery +" FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = false AND enxCPQ__Exclusive_for_Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__Order__c", 
           null,
           function (err, res) {
            if (err) reject('Failed to retrieve product attribute values. Error: ' + err);
            if (res.records.length < 200){
                Util.log("--- product attribute values: " + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
           });
       }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryProductAttributeValues(conn, productList);
        }else{
            return result;
        }
       }
    );
}

public static async bulkQueryProductAttributeValues(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting product attribute values');
    let query = "SELECT Id, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, "+ this.attrValuesQuery +" FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = false AND enxCPQ__Exclusive_for_Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__Order__c";
    return new  Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving product attribute values' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner('product attribute values export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}

public static async queryAttributeDefaultValues(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.log('--- exporting attribute default values ');
    if(productList.size >90){
        let paramsObject: Query={
            "queryBegining": "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrDefaultValuesQuery +" FROM enxCPQ__AttributeDefaultValue__c WHERE enxCPQ__Product__r.Name IN (",
            "queryConditions": ") ORDER BY enxCPQ__TECH_External_Id__c",
            "objectsList": productList,
            "sobjectName": "attribute default values"
        }
        return await Util.createQueryPromiseArray(paramsObject, conn);
    }
    return new Promise<String[]>((resolve: Function, reject: Function) => {

        conn.query("SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrDefaultValuesQuery +" FROM enxCPQ__AttributeDefaultValue__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__TECH_External_Id__c", 
        null,
        function (err, res) {
            if (err) reject('Failed to retrieve attribute default values. Error: ' + err);
            if (res.records.length < 200){
                Util.log("--- attribute default values: " + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryAttributeDefaultValues(conn, productList);
        }else{
            return result;
        }
     }
  );
}

public static async bulkQueryAttributeDefaultValues(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting attribute default values');
    let query = "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrDefaultValuesQuery +" FROM enxCPQ__AttributeDefaultValue__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__TECH_External_Id__c";
    return new  Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving attribute default values' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner('attribute default values export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}

public static async queryProductRelationships(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.log('--- exporting product relationships ');
    if(productList.size >90){
        let paramsObject: Query={
            "queryBegining": "SELECT Id, enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Secondary_Product__r.enxCPQ__TECH_External_Id__c, "+ this.productRelationshipsQuery+" FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (",
            "queryConditions": ") AND enxCPQ__Secondary_Product__c != null",
            "objectsList": productList,
            "sobjectName": "product relationships"
        }
        return await Util.createQueryPromiseArray(paramsObject, conn);
    }
    return new Promise<String[]>((resolve: Function, reject: Function) => {

        conn.query("SELECT Id, enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Secondary_Product__r.enxCPQ__TECH_External_Id__c, "+ this.productRelationshipsQuery+" FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (" + Util.setToIdString(productList) + ") AND enxCPQ__Secondary_Product__c != null", 
        null,
        function (err, res) {
            if (err) reject('Failed to retrieve product relationships. Error: ' + err);
            if (res.records.length < 200){
                Util.log("--- product relationships: " + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryProductRelationships(conn, productList);
        }else{
            return result;
        }
     }
  );
}

public static async bulkQueryProductRelationships(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting product relationships');
    let query = "SELECT Id, enxCPQ__Primary_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Secondary_Product__r.enxCPQ__TECH_External_Id__c, "+ this.productRelationshipsQuery+" FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (" + Util.setToIdString(productList) + ") AND enxCPQ__Secondary_Product__c != null";
    return new  Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving product relationships ' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner('product relationships export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}

public static async querySecondaryProducts(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.log('--- exporting secondary products ');

    if(productList.size >90){
        let paramsObject: Query={
            "queryBegining": "SELECT enxCPQ__Secondary_Product__r.Name FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (",
            "queryConditions": ") AND enxCPQ__Secondary_Product__c != null",
            "objectsList": productList,
            "sobjectName": "standard PricebookEntry"
        }
        return await Util.createQueryPromiseArray(paramsObject, conn);
    }

    return new Promise<String[]>((resolve: Function, reject: Function) => {

        conn.query("SELECT enxCPQ__Secondary_Product__r.Name FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (" + Util.setToIdString(productList) + ") AND enxCPQ__Secondary_Product__c != null", 
        null,
        function (err, res) {
            if (err) reject('Failed to retrieve secondary products . Error: ' + err);
            if (res.records.length < 200){
                Util.log("--- secondary products : " + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQuerySecondaryProducts(conn, productList);
        }else{
            return result;
        }
     }
  );
}

public static async bulkQuerySecondaryProducts(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting secondary products ');
    let query = "SELECT enxCPQ__Secondary_Product__r.Name FROM enxCPQ__ProductRelationship__c WHERE enxCPQ__Primary_Product__r.Name IN (" + Util.setToIdString(productList) + ") AND enxCPQ__Secondary_Product__c != null";
    return new  Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving secondary products  ' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner('secondary products  export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}

public static async queryAttributeValueDependencies(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.log('--- exporting attribute value dependency ');
    if(productList.size >90){
        let paramsObject: Query={
            "queryBegining": "SELECT Id, enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c,  enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrValueDependecyQuery +" FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN (",
            "queryConditions": ") ORDER BY enxCPQ__TECH_External_Id__c",
            "objectsList": productList,
            "sobjectName": "attribute value dependency"
        }
        return await Util.createQueryPromiseArray(paramsObject, conn);
    }
    return new Promise<String[]>((resolve: Function, reject: Function) => {

        conn.query("SELECT Id, enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c,  enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrValueDependecyQuery +" FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__TECH_External_Id__c", 
        null,
        function (err, res) {
            if (err) reject('Failed to retrieve attribute value dependency. Error: ' + err);
            if (res.records.length < 200){
                Util.log("--- attribute value dependency: " + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryAttributeValueDependencies(conn, productList);
        }else{
            return result;
        }
  }
 );
}

public static async bulkQueryAttributeValueDependencies(conn: Connection, productList: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting attribute value dependency');
    let query = "SELECT Id, enxCPQ__Dependent_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Dependent_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Value__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c,  enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Master_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrValueDependecyQuery +" FROM enxCPQ__AttributeValueDependency__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__TECH_External_Id__c";
    return new  Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving attribute value dependency ' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner('attribute value dependency export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}
public static async queryAttributeRules(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.log('--- exporting attribute rules ');
        if(productList.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.Name, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrRulesQuery +" FROM enxCPQ__AttributeRule__c WHERE enxCPQ__Product__r.Name IN (",
                "queryConditions": ") ORDER BY enxCPQ__Order__c",
                "objectsList": productList,
                "sobjectName": "attribute rules"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {

            conn.query("SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.Name, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrRulesQuery +" FROM enxCPQ__AttributeRule__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve attribute rules. Error: ' + err);
                if (res.records.length < 200){
                    Util.log("--- attribute rules: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });
        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryAttributeRules(conn, productList);
            }else{
                return result;
            }
      }
  );
}

public static async bulkQueryAttributeRules(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting attribute rules');
        let query = "SELECT Id, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, RecordType.Name, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, "+ this.attrRulesQuery +" FROM enxCPQ__AttributeRule__c WHERE enxCPQ__Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxCPQ__Order__c";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving attribute rules' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('attribute rules export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryProvisioningPlanAssigns(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.log('--- exporting provisioning plan assignments');
        if(productList.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxB2B__Product__r.enxCPQ__TECH_External_Id__c, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, "+ this.prvPlanAssignmentQuery +" FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.Name IN (",
                "queryConditions": ") ORDER BY enxB2B__Order__c",
                "objectsList": productList,
                "sobjectName": "provisioning plan assignments"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {

            conn.query("SELECT Id, enxB2B__Product__r.enxCPQ__TECH_External_Id__c, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, "+ this.prvPlanAssignmentQuery +" FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxB2B__Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve provisioning plan assignments Error: ' + err);
                if (res.records.length < 200){
                    Util.log("--- provisioning plan assignments: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });
        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryProvisioningPlanAssigns(conn, productList);
            }else{
                return result;
            }
         }
       );
    }

public static async bulkQueryProvisioningPlanAssigns(conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting provisioning plan assignments');
        let query = "SELECT Id, enxB2B__Product__r.enxCPQ__TECH_External_Id__c, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, "+ this.prvPlanAssignmentQuery +" FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.Name IN (" + Util.setToIdString(productList) + ") ORDER BY enxB2B__Order__c";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving provisioning plan assignments' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('provisioning plan assignments export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryCategories(conn: Connection, categoryIds: Set<String>): Promise<String[]> {
        Util.log('--- exporting categories');
        if(categoryIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Parameter_Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Category__r.enxCPQ__TECH_External_Id__c, " + this.categoryQuery +" FROM enxCPQ__Category__c WHERE enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": categoryIds,
                "sobjectName": "categories"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        if(categoryIds.size ===0){
            return[];
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {

            conn.query("SELECT Id, enxCPQ__Parameter_Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Category__r.enxCPQ__TECH_External_Id__c, " + this.categoryQuery +" FROM enxCPQ__Category__c WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(categoryIds) + ") ", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve categories. Error: ' + err);
                if (res.records.length < 200){
                    Util.log("--- categories: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });
        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryCategories(conn, categoryIds);
            }else{
                return result;
            }
      }
     );
    }

public static async bulkQueryCategories(conn: Connection, categoryIds: Set<String>): Promise<String[]> {
        Util.showSpinner('--- bulk exporting categories');
        let query = "SELECT Id, enxCPQ__Parameter_Attribute_Set__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Category__r.enxCPQ__TECH_External_Id__c, " + this.categoryQuery +" FROM enxCPQ__Category__c WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(categoryIds) + ") ";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving categories' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('categories export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryAttributeValues(conn: Connection, attributeIds: Set<String>): Promise<String[]> {
        Util.log('--- exporting product attribute values');
        if(attributeIds.size === 0){
            return[];
        }
        if(attributeIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, "+ this.attrValuesQuery+" FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = true AND enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ") ORDER BY enxCPQ__Order__c",
                "objectsList": attributeIds,
                "sobjectName": "product attribute values"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {

            conn.query("SELECT Id, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, "+ this.attrValuesQuery+" FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = true AND enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeIds) + ") ORDER BY enxCPQ__Order__c", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve product attribute values: ' + attributeIds + '. Error: ' + err);
                if (res.records.length < 200){
                    Util.log("--- product attribute values: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });
        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryAttributeValues(conn, attributeIds);
            }else{
                return result;
            }
      }
  );
}
public static async bulkQueryAttributeValues(conn: Connection, attributeIds: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting product attribute values');
        let query = "SELECT Id, enxCPQ__Exclusive_for_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, "+ this.attrValuesQuery+" FROM enxCPQ__AttributeValue__c WHERE enxCPQ__Global__c = true AND enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeIds) + ") ORDER BY enxCPQ__Order__c";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving product attribute values' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('product attribute values export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryAttributeSets(conn: Connection, attributeSetIds: Set<String>): Promise<String[]> {
        Util.log('--- exporting attributes sets');
        if(attributeSetIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, "+ this.attrSetQuery+" FROM enxCPQ__AttributeSet__c WHERE enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": attributeSetIds,
                "sobjectName": "provisioning plan assignments"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            
            conn.query("SELECT Id, "+ this.attrSetQuery+" FROM enxCPQ__AttributeSet__c WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeSetIds) + ") ", 
            null,
            function (err, res) {
                if (err) reject('Failed to retrieve attribute sets. Error: ' + err);
                if (res.records.length < 200){
                    Util.log("--- attributes sets: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });

        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryAttributeSets(conn, attributeSetIds);
            }else{
                return result;
            }
       }
   );
}

public static async bulkQueryAttributeSets(conn: Connection, attributeSetIds: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting attributes sets');
        let query = "SELECT Id, "+ this.attrSetQuery+" FROM enxCPQ__AttributeSet__c WHERE enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(attributeSetIds) + ") ";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving attributes sets' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('attributes sets export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
    }

public static async queryProvisioningPlanAssignmentIds (conn: Connection, sourceProductIds: Set<String>): Promise<String[]> {
        Util.log('--- exporting Provisioning Plan Assignment Ids ');
        if(sourceProductIds.size === 0){
            return[];
        }
        if(sourceProductIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.enxCPQ__TECH_External_Id__c IN (",
                "queryConditions": ")",
                "objectsList": sourceProductIds,
                "sobjectName": "provisioning plan assignments"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Id, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(sourceProductIds) + ")",
        null,
        function(err, res) {
            if (err) reject('error retrieving provisioning plan assigment ids: ' + err);
            if (res.records.length < 200){
                Util.log("--- Provisioning Plan Assignment Ids: " + res.records.length);
                resolve(res.records);
            }else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryProvisioningPlanAssignmentIds(conn, sourceProductIds);
        }else{
            return result;
        }
      }
    );
}

public static async bulkQueryProvisioningPlanAssignmentIds (conn: Connection, sourceProductIds: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting Provisioning Plan Assignment Ids');
    let query ="SELECT Id, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c FROM enxB2B__ProvisioningPlanAssignment__c WHERE enxB2B__Product__r.enxCPQ__TECH_External_Id__c IN (" + Util.setToIdString(sourceProductIds) + ")";
    return new Promise<String[]>((resolve: Function, reject: Function) => {
    let records = []; 
    conn.bulk.query(query)
        .on('record', function(rec) { 
            records.push(rec);
        })
        .on('error', function(err) { 
            reject(err); 
        })
        .on('end', function(info) { 
            Util.hideSpinner('Provisioning Plan Assignment Ids export done. Retrieved: '+ records.length);
            Util.sanitizeResult(records);
            resolve(records); 
        });
   })
}
public static async queryProvisioningTaskAssignmentIds (conn: Connection, prvPlanIds: Set<String>): Promise<String[]> {
        Util.log('--- exporting provisioning task assigment ids ');
        if(prvPlanIds.size === 0){
            return[];
        }
        if(prvPlanIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id FROM enxB2B__ProvisioningTaskAssignment__c WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (",
                "queryConditions": ")",
                "objectsList": prvPlanIds,
                "sobjectName": "provisioning task assignments ids"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Id FROM enxB2B__ProvisioningTaskAssignment__c WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (" + Util.setToIdString(prvPlanIds) + ")",
        null,
        function(err, res) {
            if (err) reject('error retrieving provisioning task assigment ids: ' + err);
            if (res.records.length < 200){
                Util.log("--- provisioning task assigment ids: " + res.records.length);
               resolve(res.records);
            }else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryProvisioningTaskAssignmentIds(conn, prvPlanIds);
        }else{
            return result;
        }
      }
    );
}

public static async bulkQueryProvisioningTaskAssignmentIds (conn: Connection, prvPlanIds: Set<String>): Promise<String[]> {
    Util.showSpinner('---bulk exporting provisioning task assigment ids');
    if(prvPlanIds.size === 0){
        return[];
    }
    let query ="SELECT Id FROM enxB2B__ProvisioningTaskAssignment__c WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (" + Util.setToIdString(prvPlanIds) + ")";
    return new Promise<String[]>((resolve: Function, reject: Function) => {
    let records = []; 
    conn.bulk.query(query)
        .on('record', function(rec) { 
            records.push(rec);
        })
        .on('error', function(err) { 
            reject(err); 
        })
        .on('end', function(info) { 
            Util.hideSpinner('provisioning task assigment ids export done. Retrieved: '+ records.length);
            Util.sanitizeResult(records);
            resolve(records); 
        });
   })
}

public static async queryProvisioningTaskAssignments (conn: Connection, prvPlanIds: Set<String>): Promise<String[]> {
        Util.log('--- exporting Provisioning task assignments');
        if(prvPlanIds.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Id, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, enxB2B__Provisioning_Task__r.enxB2B__TECH_External_Id__c, "+ this.prvTaskAssignmentQuery +" FROM enxB2B__ProvisioningTaskAssignment__c  WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (",
                "queryConditions": ")",
                "objectsList": prvPlanIds,
                "sobjectName": "provisioning task assignments"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Id, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, enxB2B__Provisioning_Task__r.enxB2B__TECH_External_Id__c, "+ this.prvTaskAssignmentQuery +" FROM enxB2B__ProvisioningTaskAssignment__c  WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (" + Util.setToIdString(prvPlanIds) + ")",
        null,
        function(err, res) {
            if (err) reject('error retrieving provisioning task assignments: ' + err);
            if (res.records.length < 200){
                Util.log("--- provisioning task assignments: " + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryProvisioningTaskAssignments(conn, prvPlanIds);
        }else{
            return result;
        }
  }
);
}

public static async bulkQueryProvisioningTaskAssignments (conn: Connection, prvPlanIds: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting Provisioning task assignments');
        let query = "SELECT Id, enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c, enxB2B__Provisioning_Task__r.enxB2B__TECH_External_Id__c, "+ this.prvTaskAssignmentQuery +" FROM enxB2B__ProvisioningTaskAssignment__c WHERE enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c IN  (" + Util.setToIdString(prvPlanIds) + ")";
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
            let records = []; 
            conn.bulk.query(query)
                .on('record', function(rec) { 
                    records.push(rec);
                })
                .on('error', function(err) { 
                    reject('error retrieving provisioning task assignments' + err);  
                })
                .on('end', function(info) { 
                    Util.hideSpinner('Provisioning task assignments export done. Retrieved: '+ records.length);
                    Util.sanitizeResult(records);
                    resolve(records); 
                });
        })
}

public static async queryPriceRules (conn: Connection): Promise<String[]> {
        Util.log('--- exporting  price rules ');
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Name, RecordType.Name, enxCPQ__Account__r.enxCPQ__TECH_External_Id__c, enxCPQ__Active__c, enxCPQ__Conditions_Logic__c, enxCPQ__Order__c, enxCPQ__Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c, enxCPQ__Tier_Field__c FROM enxCPQ__PriceRule__c", 
        null,
        function(err, res) {
            if (err) reject('error retrieving price rules: ' + err);

            resolve(res.records);
        });
    });
}
public static async queryPriceRuleConditions (conn: Connection): Promise<String[]>  {
        Util.log('--- exporting price rule conditions ');
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Name, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Field_Name__c, enxCPQ__Operator__c, enxCPQ__Order__c, enxCPQ__Price_Rule__r.enxCPQ__TECH_External_Id__c, enxCPQ__TECH_External_Id__c, enxCPQ__Value__c FROM enxCPQ__PriceRuleCondition__c", 
        null,
        function(err, res) {
            if (err) reject('error retrieving price rule conditions: ' + err);
            
            resolve(res.records);
        });
    });
}

public static async queryPriceRuleActions (conn: Connection): Promise<String[]>  {
        Util.log('--- exporting Price Rules ');
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Name, enxCPQ__Action_Type__c, enxCPQ__Charge__r.enxCPQ__TECH_External_Id__c, enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Field_Name__c, enxCPQ__Order__c, enxCPQ__Price_Rule__r.enxCPQ__TECH_External_Id__c, enxCPQ__Target_Field_Name__c, enxCPQ__Target_Value__c, enxCPQ__TECH_External_Id__c, enxCPQ__Tier_Value_From__c, enxCPQ__Tier_Value_To__c FROM enxCPQ__PriceRuleAction__c", 
        null,
        function(err, res) {
            if (err) reject('error retrieving price rule actions: ' + err);
            
            resolve(res.records);
        });
    })    
    }
public static async queryChargeElementStdPricebookEntries (conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.log('--- exporting Charge Elements standard PricebookEntry ');
        if(productList.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery +" FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name = 'Charge Element'",
                "objectsList": productList,
                "sobjectName": "Charge Elements standard PricebookEntry"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery +" FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name = 'Charge Element'", 
        null,
        function(err, res) {
            if (err) reject('error retrieving Charge Elements standard PricebookEntry: ' + err);
            if (res.records.length < 200){
                Util.log("--- Charge Elements standard PricebookEntry: " + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryChargeElementStdPricebookEntries(conn, productList);
        }else{
            return result;
        }
  }
);    
}

public static async bulkQueryChargeElementStdPricebookEntries (conn: Connection, productList:  Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting charge element standard pricebook entries');
        let query = "SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery +" FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ") AND Pricebook2.IsStandard = true AND Product2.RecordType.Name = 'Charge Element'";
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving charge element standard pricebook entries ' + err); 
            })
            .on('end', function(info) { 
                Util.hideSpinner('charge element standard pricebook entries export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
    }

public static async queryChargeElementPricebookEntries (conn: Connection, productList: Set<String>): Promise<String[]> {
        Util.log('--- exporting Charge Elements  PricebookEntry ');
        if(productList.size >90){
            let paramsObject: Query={     
                "queryBegining": "SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND Pricebook2.IsStandard = false AND Product2.RecordType.Name = 'Charge Element'",
                "objectsList": productList,
                "sobjectName": "Charge Elements  PricebookEntry"
            }
            return await Util.createQueryPromiseArray(paramsObject, conn);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        conn.query("SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ") AND Pricebook2.IsStandard = false AND Product2.RecordType.Name = 'Charge Element'", 
        null,
        function(err, res) {
            if (err) reject('error retrieving Charge Element Pricebook Entries: ' + err);
            if (res.records.length < 200){
                Util.log("--- Charge Elements PricebookEntry: " + res.records.length);
                resolve(res.records);
            }
            else{
                resolve(["useBulkApi"]);
            }
        });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryChargeElementPricebookEntries(conn, productList);
        }else{
            return result;
        }
     }
  );    
}
    // FIELDS removed from query because they were putting "0" instead of null -> enxCPQ__Price_Modifier_Amount__c, enxCPQ__Price_Modifier_Percent__c, enxCPQ__Price_Override__c
public static async bulkQueryChargeElementPricebookEntries (conn: Connection, productList:  Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting Charge Element Pricebook Entries');
        let query = "SELECT Pricebook2.enxCPQ__TECH_External_Id__c, Product2.enxCPQ__TECH_External_Id__c, CurrencyIsoCode, Pricebook2Id, Product2Id," + this.pbeQuery + " FROM PricebookEntry WHERE Product2.enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ") AND Pricebook2.IsStandard = false AND Product2.RecordType.Name = 'Charge Element'";
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving charge element pricebook entries ' + err); 
            })
            .on('end', function(info) { 
                Util.hideSpinner('Charge Element Pricebook Entries export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records);           
            });
    })
}

public static async queryChargeElements (conn: Connection, productList: Set<String>, chargeList: Set<String>): Promise<String[]> {
    if(productList.size + chargeList.size>90){
        let paramsObject1: Query={
            "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN (",
            "queryConditions": ") AND RecordType.Name = 'Charge Element'",
            "objectsList": productList,
            "sobjectName": "charge Element"
        }
        let paramsObject2: Query={
            "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN (",
            "queryConditions": ") AND RecordType.Name = 'Charge Element'",
            "objectsList": chargeList,
            "sobjectName": "charge Element"
        }
        return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
    }
        Util.showSpinner('--- exporting charge elements ');
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            conn.query("SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE (enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ") or enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(chargeList) + ")) AND RecordType.Name = 'Charge Element'",
            null,
            function(err, res) {
                if (err) reject('error retrieving charge elements: ' + err);
                Util.hideSpinner('charge elements export done')
                if (res.records.length < 200){
                    Util.log("--- charge elements: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });
        }).then(async result =>{
            if(result[0] === 'useBulkApi'){
                return await this.bulkQueryChargeElements(conn, productList, chargeList);
            }else{
                return result;
            }
      }
  ); 
}
public static async bulkQueryChargeElements (conn: Connection, productList: Set<String>, chargeList: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting charge elements');
        let query = "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE (enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ") or enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(chargeList) + ")) AND RecordType.Name = 'Charge Element'";
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving charge elements: ' + err); 
            })
            .on('end', function(info) { 
                Util.hideSpinner('charge elements export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
}

public static async queryChargeTiers (conn: Connection,  productList: Set<String>, chargeList: Set<String>): Promise<String[]> {
        Util.log('--- exporting charge Tiers ');
        if(productList.size + chargeList.size>90){
            let paramsObject1: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND RecordType.Name = 'Charge Tier'",
                "objectsList": productList,
                "sobjectName": "charge tier"
            }
            let paramsObject2: Query={     
                "queryBegining": "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE enxCPQ__Root_Product__r.Name IN (",
                "queryConditions": ") AND RecordType.Name = 'Charge Tier'",
                "objectsList": chargeList,
                "sobjectName": "charge tier"
            }
            return await Util.createQueryPromiseArray(paramsObject1, conn, paramsObject2);
        }
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            conn.query("SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE (enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ") or enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(chargeList) + ")) AND RecordType.Name = 'Charge Tier'",
            null,
            function(err, res) {
                if (err) reject('error retrieving charge Tiers: ' + err);
                if (res.records.length < 200){
                    Util.log("--- charge Tiers: " + res.records.length);
                    resolve(res.records);
                }
                else{
                    resolve(["useBulkApi"]);
                }
            });
    }).then(async result =>{
        if(result[0] === 'useBulkApi'){
            return await this.bulkQueryChargeTiers(conn, productList, chargeList);
        }else{
            return result;
        }
   }
 );    
}

public static async bulkQueryChargeTiers (conn: Connection,  productList: Set<String>, chargeList: Set<String>): Promise<String[]> {
        Util.showSpinner('---bulk exporting charge Tiers');
        let query = "SELECT Id, enxCPQ__Category__r.enxCPQ__TECH_External_Id__c, enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c, enxCPQ__Parent_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Root_Product__r.enxCPQ__TECH_External_Id__c, enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c, RecordType.Name, "+this.productQuery+" FROM Product2 WHERE (enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(productList) + ") or enxCPQ__Root_Product__r.Name IN (" + Util.setToIdString(chargeList) + ")) AND RecordType.Name = 'Charge Tier'";
        return new Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving charge Tiers: ' + err); 
            })
            .on('end', function(info) { 
                Util.hideSpinner('charge Tiers export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
    }

    // FIELDS removed from query because they were putting "0" instead of null -> enxCPQ__Price_Modifier_Amount__c, enxCPQ__Price_Modifier_Percent__c, enxCPQ__Price_Override__c
public static async bulkQueryChargeElementPricebookEntryIds (conn: Connection, productName: String): Promise<string> {
        Util.showSpinner('---bulk exporting charge element pricebook entries ids');
        let query = "SELECT Id FROM PricebookEntry WHERE Product2.RecordType.Name = 'Charge Element' AND Product2.enxCPQ__Root_Product__r.Name = '" + productName + "'";
        return new Promise<string>((resolve: Function, reject: Function) => {
        let records = []; 
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving charge element pricebook entries ids' + err); 
            })
            .on('end', function(info) { 
                Util.hideSpinner('charge element pricebook entries ids export done. Retrieved: '+ records.length);
                Util.sanitizeResult(records);
                resolve(records); 
            });
    })
    }
}