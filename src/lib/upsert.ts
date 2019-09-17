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

    public static fixIds (elemArray:any) {
 
        for (let elem of elemArray) {

            if (elem['Pricebook2'] && elem['Pricebook2'] !== null) {
                let pbookTechId = elem['Pricebook2']['enxCPQ__TECH_External_Id__c'];
                
                // workaround for standard pricebooks that do not have TECH External ID defined
                if (pbookTechId === null) {
                    pbookTechId = 'std';
                }

                let targetPricebookId = this.idMapping[pbookTechId];

                if (targetPricebookId !== null) {
                    elem['Pricebook2Id'] = targetPricebookId;
                    delete elem['Pricebook2'];
                }
            }

            if (elem['Product2'] && elem['Product2'] !== null) {
                let productTechId = elem['Product2']['enxCPQ__TECH_External_Id__c'];
                let targetProductId = this.idMapping[productTechId];
                if (targetProductId !== null) {
                    elem['Product2Id'] = targetProductId;
                    delete elem['Product2'];
                }
            }
        }
    }

    public static mapProducts (sourceProducts, targetProducts) {
        for (let sourceProduct of sourceProducts) {
            for (let j = 0; j < targetProducts.length; j++) {
                if (sourceProduct === targetProducts[j].techId) {
                    this.idMapping[sourceProduct] = targetProducts[j].Id;
                    break;
                }
            }
        }
    }

    public static mapPricebooks  (sourcePricebooks:any, targetPricebooks:any){
    
        console.log("--- mapping pricebooks");
        for (let i = 0 ; i < sourcePricebooks.length; i++) {
            for (let j = 0; j < targetPricebooks.length; j++) {
                if (sourcePricebooks[i].techId != null && sourcePricebooks[i].techId === targetPricebooks[j].techId) {
                    this.idMapping[sourcePricebooks[i].techId] = targetPricebooks[j].Id;
                    break;
                }
                if (sourcePricebooks[i].IsStandard && targetPricebooks[j].IsStandard) {
                    this.idMapping['std'] = targetPricebooks[j].Id;
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
                if (err) { reject('error creating pbe' + err); }
                    let successCount = 0;
                    let errorsCount = 0;
                    for (let i=0; i < rets.length; i++) {
                    if (rets[i].success) {
                        successCount++;
                    } else {
                        errorsCount++;
                    }
                    if(i===rets.length-1){
                        Util.log("--- Pbe insert success: " + successCount + " errors: " + errorsCount + "\r");
                }}
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
    }

    public static async upsertObject(conn: core.Connection, sObjectName: string, data: Object[]): Promise<string> {
        if(data.length===0){
           return;
        }
        Util.log('--- importing ' + sObjectName + ': ' + data.length + ' records');
        let b2bNames = ['enxB2B__ProvisioningPlan__c','enxB2B__ProvisioningTask__c','enxB2B__ProvisioningPlanAssignment__c', 'enxB2B__ProvisioningTaskAssignment__c'];
        let techId = b2bNames.includes(sObjectName)  ? 'enxB2B__TECH_External_Id__c' : 'enxCPQ__TECH_External_Id__c';
        Util.sanitizeForImport(data);

        let promises:Array<Promise<RecordResult>> = new Array<Promise<RecordResult>>();
        for (const record of data) {
            promises.push(conn.sobject(sObjectName).upsert(record, techId, {}, function(err: any, rets: RecordResult) {
            if (err) {
                Util.log('error creating ' + sObjectName + ': ' + err);
                return;
            }   
        }));
        }
        await Promise.all(promises);
    }

    public static async deleteObject(conn: core.Connection, sObjectName: string, data: string[]): Promise<string> {
        if(data.length===0){
            return;
         }
        Util.log('--- deleting ' + sObjectName + ': ' + data.length + ' records');
        let promises:Array<Promise<RecordResult>> = new Array<Promise<RecordResult>>();
        for (const record of data) {
            promises.push(conn.sobject(sObjectName).del(record, function(err: any, rets) {
                if (err) {
                    Util.log('error creating ' + sObjectName + ': ' + err);
                    return;
                }   
            }));
        }
        await Promise.all(promises);
    }
}