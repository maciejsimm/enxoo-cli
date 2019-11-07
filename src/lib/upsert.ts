import { RecordResult, Connection } from 'jsforce';
import { Util } from './Util';
import * as _ from 'lodash';
export class Upsert {
    private static idMapping = {};

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

        Util.log("--- mapping products");
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
    
        Util.log("--- mapping pricebooks");
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

    public static disableTriggers(conn: Connection, userName: string){
        Util.log("---disabling triggers");
        let data = { Name: "G_CPQ_DISABLE_TRIGGERS_99",
                     enxCPQ__Setting_Name__c: "CPQ_DISABLE_TRIGGERS",
                     enxCPQ__Context__c: "Global",
                     enxCPQ__Col1__c: userName };
    
         return new Promise<string>((resolve: Function, reject: Function) => {
            conn.sobject("enxCPQ__CPQ_Settings__c").insert(data, function(err, rets) {
                if (err) {
                    reject('error disabling triggers: ' + err);
                    return;
                }
            Util.log("--- trigers disabled");
           
            resolve();
            });
        });      
    }

    public static enableTriggers(conn){
        Util.log("---enabling triggers");
        return new Promise<string>((resolve: Function, reject: Function) => {
            conn.query("SELECT Id FROM enxCPQ__CPQ_Settings__c WHERE Name = 'G_CPQ_DISABLE_TRIGGERS_99'", null, function(err, res) {
                if (res.records.length == 0){
                    resolve();
                } 
                conn.sobject("enxCPQ__CPQ_Settings__c").del(res.records[0].Id, function(err, rets) {
                    if (err) {
                        reject('error enabling triggers: ' + err);
                        return;
                    }
                    Util.log("--- trigers enabled");
                    resolve();
                }); 
            });
        });      
    }

    public static async insertObject(conn: Connection, sObjectName: string, data: Object[]): Promise<string>{ 
        Util.sanitizeForInsert(data, sObjectName);
        if(sObjectName ==='PricebookEntry'){
            this.fixIds(data);
        }
        if(data.length > 80 && data.length < 9001){
            await this.insertbulkObject(conn, sObjectName, data);
            return;
        }
        if(data.length > 9000){
            let dataBulkArrs = _.chunk(data, 9000);
            Util.log('-----  ' + data.length + ' ' + sObjectName + ' chunked');
            for (let dataBulkArr of dataBulkArrs) {
                await this.insertbulkObject(conn, sObjectName, dataBulkArr);
            }
            return;
        }
        Util.log('--- inserting ' + sObjectName + ': ' + data.length + ' records');
        if(data.length===0){
            return;
         }
      
        return new Promise<string>((resolve: Function, reject: Function) => {
            conn.sobject(sObjectName).create(data,async (err:any, rets:RecordResult[]) => {
                if (err) {
                    Util.log(err);
                    reject('error creating ' + sObjectName + ': ' + err);
                    return;
                }
                
                let successCount = rets
                                .map((elem:RecordResult):number => { return (elem.success ? 1 : 0) })
                                .reduce((prevVal:number, nextVal:number) => { return (prevVal + nextVal) });

                await Util.hideSpinner(' Done. Success: ' + successCount + ', Errors: ' + (data.length - successCount)); 
                rets.forEach(async (ret, i) => {
                    if (ret.success === false) {
                        ret.errors.forEach(async err=> {
                            await Util.log('----- ['+ i +'] errors: ' + err['message']);
                        })
                    } 
                })

                resolve('OK');
            });
        });

    }
    
    public static async insertbulkObject(conn, sObjectName, data): Promise<string>{ 
        Util.log('--- inserting bulk ' + sObjectName + ': ' + data.length + ' records');
        Util.sanitizeForBulkImport(data);
         return new Promise((resolve, reject) => {
            conn.bulk.load(sObjectName, "insert", data, async (err:any, rets:RecordResult[]) => {
                if (err) {
                    Util.log(err);
                    reject('error creating ' + sObjectName + ': ' + err);
                    return;
                }
                
                let successCount = rets
                                .map((elem:RecordResult):number => { return (elem.success ? 1 : 0) })
                                .reduce((prevVal:number, nextVal:number) => { return (prevVal + nextVal) });

                await Util.hideSpinner(' Done. Success: ' + successCount + ', Errors: ' + (data.length - successCount)); 
                rets.forEach(async (ret, i) => {
                    if (ret.success === false) {
                        await Util.log('----- ['+ i +'] errors: ' + ret.errors);
                    } 
                })

                resolve('OK');
            });
        });
    }

    public static async upsertObject(conn: Connection, sObjectName: string, data: Object[]): Promise<string> {
        Util.sanitizeForUpsert(data);
        let b2bNames = ['enxB2B__ProvisioningPlan__c','enxB2B__ProvisioningTask__c','enxB2B__ProvisioningPlanAssignment__c'];
        let techId = b2bNames.includes(sObjectName)  ? 'enxB2B__TECH_External_Id__c' : 'enxCPQ__TECH_External_Id__c';
        if(sObjectName === 'enxB2B__ProvisioningTaskAssignment__c'){techId = 'enxB2B__TECH_External_ID__c'};
        
        if(data.length===0){
            Util.log('--- importing ' + sObjectName + ': ' + data.length + ' records');
            return;
        }

        if((data.length > 80 || sObjectName === 'enxCPQ__AttributeValue__c') && data.length < 9001){
            await this.upsertBulkObject(conn, sObjectName, data, techId);
            return;
        }
        if(data.length > 9000){
            let dataBulkArrs = _.chunk(data, 9000);
            Util.log('-----  ' + data.length + ' ' + sObjectName + ' chunked');
            for (let dataBulkArr of dataBulkArrs) {
                await this.upsertBulkObject(conn, sObjectName, dataBulkArr, techId);
            }
            return;
        }

        Util.log('--- importing ' + sObjectName + ': ' + data.length + ' records');

        return new Promise<string>((resolve: Function, reject: Function) => {
            conn.sobject(sObjectName).upsert(data, techId, {}, async (err:any, rets:RecordResult[]) => {
                if (err) {
                    Util.log(err);
                    reject('error creating ' + sObjectName + ': ' + err);
                    return;
                }
                
                let successCount = rets
                                .map((elem:RecordResult):number => { return (elem.success ? 1 : 0) })
                                .reduce((prevVal:number, nextVal:number) => { return (prevVal + nextVal) });

                await Util.hideSpinner(' Done. Success: ' + successCount + ', Errors: ' + (data.length - successCount)); 
                rets.forEach(async (ret, i) => {
                    if (ret.success === false) {
                        ret.errors.forEach(async err=> {
                            await Util.log('----- ['+ i +'] errors: ' + err['message']);
                        })
                    }
                })

                resolve('OK');
            });
        });
    }

    private static async upsertBulkObject(conn: Connection, sObjectName: string, data: Object[], techId: string): Promise<string> {
        Util.log('--- bulk importing ' + sObjectName + ': ' + data.length + ' records');
        Util.sanitizeForBulkImport(data);
        return new Promise<string>((resolve: Function, reject: Function) => {
            conn.bulk.load(sObjectName, 'upsert', {'extIdField': techId}, data, async (err:any, rets:RecordResult[]) => {
                if (err) {
                    Util.log(err);
                    reject('error creating ' + sObjectName + ': ' + err);
                    return;
                }
                
                let successCount = rets
                                .map((elem:RecordResult):number => { return (elem.success ? 1 : 0) })
                                .reduce((prevVal:number, nextVal:number) => { return (prevVal + nextVal) });

                await Util.hideSpinner(' Done. Success: ' + successCount + ', Errors: ' + (data.length - successCount)); 
                rets.forEach(async (ret, i) => {
                    if (ret.success === false) {
                        await Util.log('----- ['+ i +'] errors: ' + ret.errors);
                    } 
                })

                resolve('OK');
            });
        });
    }

    public static async deleteObject(conn: Connection, sObjectName: string, data: string[]): Promise<string> {
        if(data.length===0){
            return;
         }
         if(data.length > 80  && data.length < 9001){
            await this.deleteBulkObject(conn, sObjectName, data);
            return;
        }
        if(data.length > 9000){
            let dataBulkArrs = _.chunk(data, 9000);
            Util.log('-----  ' + data.length + ' ' + sObjectName + ' chunked');
            for (let dataBulkArr of dataBulkArrs) {
                await this.deleteBulkObject(conn, sObjectName, dataBulkArr);
            }
            return;
        }
         Util.log('--- deleting ' + sObjectName + ': ' + data.length + ' records');
         return new Promise<string>((resolve: Function, reject: Function) => {
             conn.sobject(sObjectName).del(data, function(err: any, rets: RecordResult[]) {
                 if (err) {
                     reject('error deleting ' + sObjectName + ' ' + err);
                     return;
                 }
                 let errorsCount = 0;
                 for (let i = 0; i < rets.length; i++) {
                     if (!rets[i].success) {
                         Util.log('----- !!! - success: ' + rets[i].success);
                         errorsCount++;
                     }
                 }
             Util.log('--- deleted ' + sObjectName + ' '+ rets.length + ', errors: ' + errorsCount);
             resolve();
             });
         });
    }

    public static async deleteBulkObject(connection: Connection, sObjectName: string, objectsIds: string[]): Promise<string> {
        Util.log('--- bulk deleting ' + sObjectName + ': ' + objectsIds.length + ' records');
       
        const recordsToDelete = objectsIds.map((objectId: string) => (
            {Id: objectId}
        ));

        return new Promise<string>((resolve: Function, reject: Function) => {
            connection.bulk.load(sObjectName, 'delete', {extIdField: 'enxCPQ__TECH_External_Id__c'}, recordsToDelete, async (error:any, results:RecordResult[]) => {
                if (error) {
                    Util.log(error);
                    reject('error deleting ' + sObjectName + ': ' + error);
                    return;
                }
                
                let successCount = results.filter((recordResult:RecordResult) => recordResult.success).length;

                await Util.hideSpinner(' Done. Success: ' + successCount + ', Errors: ' + (recordsToDelete.length - successCount)); 
                results.forEach(async (recordResult: RecordResult, index: number) => {
                    if (recordResult.success === false) {
                        await Util.log('----- ['+ index +'] errors: ' + recordResult.errors);
                    } 
                })

                resolve('OK');
            });
        });
    }
}