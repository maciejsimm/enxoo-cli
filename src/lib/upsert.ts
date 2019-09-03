import { core } from "@salesforce/command";
import { RecordResult } from 'jsforce';
import { Util } from './Util';
export class Upsert {
    private static idMapping = {};
    public static async deletePricebookEntries(conn: core.Connection, data: any) { 
       let extractedData = this.extractIds(data);
        return new Promise<string>((resolve: Function, reject: Function) => {
           
            conn.sobject("PricebookEntry").del(extractedData,  function(err, rets) {
                
                
                if (err) {
                    reject('error deleting pricebook entries: ' + err);
                    return;
                }
             
          
            });
        });
    }

    public static async upsertPricebookEntries(conn: core.Connection, data: any) { 
        this.sanitize(data);
        this.fixIds(data);
        return new Promise<string>((resolve: Function, reject: Function) => {
            conn.sobject("PricebookEntry").insert(data, function(err, rets) {
                if (err) {
                    reject('error creating pricebook entries: ' + err);
                    return;
                }
        
            resolve();
            });
        });
    };

    public static extractIds(arr : any) {
        let targetArr = []
        for (let i = 0; i < arr.length; i++) {
          targetArr.push(arr[i].Id);
        }
        return targetArr;
      }

      public static sanitize  (arr:any)  {
        if (!(arr instanceof Array)) {
            for (let prop in arr) {
                if (prop === 'attributes') delete arr[prop];
                if (prop.indexOf('__r') !== -1 && arr[prop] == null) delete arr[prop];
                if (typeof(arr[prop]) === 'object') {
                    for (let innerProp in arr[prop]) {
                        if (innerProp === 'attributes') delete arr[prop][innerProp];
                    }
                }
            }
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            for (let prop in arr[i]) {
                if (prop === 'attributes') delete arr[i][prop];
                if (prop.indexOf('__r') !== -1 && arr[i][prop] == null) delete arr[i][prop];
                if (typeof(arr[i][prop]) === 'object') {
                    for (let innerProp in arr[i][prop]) {
                        if (innerProp === 'attributes') delete arr[i][prop][innerProp];
                    }
                }
            }
        }
    
        for (let prop in arr) {
            if (prop === 'attributes') delete arr[prop];
            if (prop.indexOf('__r') !== -1 && arr[prop] == null) delete arr[prop];
            if (typeof(arr[prop]) === 'object') {
                for (let innerProp in arr[prop]) {
                    if (innerProp === 'attributes') delete arr[prop][innerProp];
                }
            }
        } 
    }

    public static fixIds (arrs:any) {

        for (let arr of arrs) {
            if (arr['Pricebook2Id'] !== undefined) {
                arr['Pricebook2Id'] = this.idMapping[arr['Pricebook2Id']];   
            }
            if (arr['Product2Id'] !== undefined) {
                arr['Product2Id'] = this.idMapping[arr['Product2Id']];   
            }
        }
    }

    public static mapPricebooks  (sourcePricebooks:any, targetPricebooks:any){
    
        console.log("--- mapping pricebooks");
        for (let i = 0 ; i < sourcePricebooks.length; i++) {
            for (let j = 0; j < targetPricebooks.length; j++) {
                if (sourcePricebooks[i].enxCPQ__TECH_External_Id__c != null && sourcePricebooks[i].enxCPQ__TECH_External_Id__c === targetPricebooks[j].enxCPQ__TECH_External_Id__c) {
                    this.idMapping[sourcePricebooks[i].Id] = targetPricebooks[j].Id;
                    break;
                }
                if (sourcePricebooks[i].IsStandard && targetPricebooks[j].IsStandard) {
                    this.idMapping[sourcePricebooks[i].Id] = targetPricebooks[j].Id;
                    break;
                }
            }
        }
    }

    public static mapProducts (sourceProducts, targetProducts) {
   
        for (let i = 0 ; i < sourceProducts.length; i++) {
            for (let j = 0; j < targetProducts.length; j++) {
                if (sourceProducts[i].enxCPQ__TECH_External_Id__c === targetProducts[j].enxCPQ__TECH_External_Id__c) {
                    this.idMapping[sourceProducts[i].Id] = targetProducts[j].Id;
                    break;
                }
            }
        }
    }
    public static disableTriggers(conn: core.Connection){
        let data = { Name: "G_CPQ_DISABLE_TRIGGERS_99",
                     enxCPQ__Setting_Name__c: "CPQ_DISABLE_TRIGGERS",
                     enxCPQ__Context__c: "Global",
                     enxCPQ__Col1__c: conn.getUsername() };
    
         return new Promise<string>((resolve: Function, reject: Function) => {
            conn.sobject("enxCPQ__CPQ_Settings__c").insert(data, function(err, rets) {
                if (err) {
                    reject('error disabling triggers: ' + err);
                    return;
                }
            console.log("--- trigers disabled");
           
            resolve();
            });
        });      
    }

    public static enableTriggers(conn){
        return new Promise<string>((resolve: Function, reject: Function) => {
            conn.query("SELECT Id FROM enxCPQ__CPQ_Settings__c WHERE Name = 'G_CPQ_DISABLE_TRIGGERS_99'", function(err, res) {
                if (res.records.length == 0) resolve();
                conn.sobject("enxCPQ__CPQ_Settings__c").del(res.records[0].Id, function(err, rets) {
                    if (err) {
                        reject('error enabling triggers: ' + err);
                        return;
                    }
                    console.log("--- trigers enabled");
                    resolve();
                }); 
            });
        });      
    }
    public static async upsertBulkPricebookEntries(conn, data)  {
        this.sanitize(data);
        this.fixIds(data);
        return new Promise((resolve, reject) => {
            conn.bulk.load("PricebookEntry", "insert", data, function(err, rets) {
                if (err) { reject(err); }
                var successCount = 0;
                var errorsCount = 0;
                for (var i=0; i < rets.length; i++) {
                    if (rets[i].success) {
                        successCount++;
                    } else {
                        errorsCount++;
                    }
                    process.stdout.write("--- insert success: " + successCount + " errors: " + errorsCount + "\r");
                }
                resolve();
            });
        });
    }

    public static async insertObject(conn: core.Connection, sObjectName:string, data: Object[]): Promise<string>{ 
        Util.log('--- importing ' + sObjectName + ': ' + data.length + ' records');
        this.sanitize(data);
        if(data.length===0){
            return;
         }
        let promises:Array<Promise<RecordResult>> = new Array<Promise<RecordResult>>();
        for (const record of data) {
            promises.push(conn.sobject(sObjectName).create(record, function(err: any, rets: RecordResult) {
                if (err) {
                    Util.log('error creating ' + sObjectName + ': ' + err);
                    return;
                }   
            }))
        }
        await Promise.all(promises);
    };

}