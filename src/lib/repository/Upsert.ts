import { Connection } from "@salesforce/core";
import { Util } from './../Util';

import { RecordResult } from 'jsforce';
import { resolve } from "dns";

export class Upsert {
    public static async upsertData(connection: Connection, records: Array<any>, sObjectName: string) {
        Util.showSpinner('-- Upserting ' + sObjectName);
        
        const externalIdString = (sObjectName.startsWith('enxB2B__') ? 'enxB2B__TECH_External_Id__c' : 'enxCPQ__TECH_External_Id__c');
        let sobjectsResult:Array<RecordResult> = new Array<RecordResult>();

        // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
        sobjectsResult = await connection.sobject(sObjectName).upsert(records, externalIdString, {}, (err, rets:RecordResult[]) => {
            if (err) { 
                Util.log(err); 
            }
        });

        const successCount = sobjectsResult.map((r):number => {return (r.success ? 1 : 0)})
                                            .reduce((prevVal:number, nextVal:number) => {return prevVal+nextVal});

        const errorCount = sobjectsResult.map((r):number => {return (r.success ? 0 : 1)})
                                            .reduce((prevVal:number, nextVal:number) => {return prevVal+nextVal});

        
        await Util.hideSpinner(' done. Success: ' + successCount + ', errors: ' + errorCount);

        if (errorCount > 0) {
            const errors = sobjectsResult.filter((elem) => {
                                            return elem.success === false;
                                        }).map((elem) => {
                                            return {"error": elem['errors']};
                                        });
            await Util.warn(JSON.stringify(errors, null, 2));
        }
    }

    public static async insertData(connection: Connection, records: Array<any>, sObjectName: string) {
        Util.showSpinner('-- Inserting ' + sObjectName);
        let sobjectsResult:Array<RecordResult> = new Array<RecordResult>();

        // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
        sobjectsResult = await connection.sobject(sObjectName).insert(records, { allowRecursive: true }, (err, rets) => {
            if (err) { Util.log(err); }
        });

        const successCount = sobjectsResult.map((r):number => {return (r.success ? 1 : 0)})
                                        .reduce((prevVal:number, nextVal:number) => {return prevVal+nextVal});

        const errorCount = sobjectsResult.map((r):number => {return (r.success ? 0 : 1)})
                                        .reduce((prevVal:number, nextVal:number) => {return prevVal+nextVal});

        await Util.hideSpinner(' done. Success: ' + successCount + ', errors: ' + errorCount);

        if (errorCount > 0) {
            const errors = sobjectsResult.filter((elem) => {
                                            return elem.success === false;
                                        }).map((elem) => {
                                            return {"error": elem['errors']};
                                        });
            await Util.warn(JSON.stringify(errors, null, 2));
        }
    }

    public static async deleteData(connection: Connection, records: Array<any>, sObjectName: string) {
        Util.showSpinner('-- Deleting ' + sObjectName);
        let sobjectsResult:Array<RecordResult> = new Array<RecordResult>();
        const data = this.extractIds(records);

        // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
        sobjectsResult = await connection.sobject(sObjectName).del(data, { allowRecursive: true }, (err, rets) => {
            if (err) { Util.log(err); }
        });

        const successCount = sobjectsResult.map((r):number => {return (r.success ? 1 : 0)})
                                        .reduce((prevVal:number, nextVal:number) => {return prevVal+nextVal});

        const errorCount = sobjectsResult.map((r):number => {return (r.success ? 0 : 1)})
                                        .reduce((prevVal:number, nextVal:number) => {return prevVal+nextVal});

        await Util.hideSpinner(' done. Success: ' + successCount + ', errors: ' + errorCount);

        if (errorCount > 0) {
            const errors = sobjectsResult.filter((elem) => {
                                            return elem.success === false;
                                        }).map((elem) => {
                                            return {"error": elem['errors']};
                                        });
            await Util.warn(JSON.stringify(errors, null, 2));
        }
    }

    public static async disableTriggers(connection: Connection) {

        Util.showSpinner('-- Disabling triggers');

        await this.enableTriggers(connection, false);

        const data = { Name: "G_CPQ_DISABLE_TRIGGERS_99",
                        enxCPQ__Setting_Name__c: "CPQ_DISABLE_TRIGGERS",
                        enxCPQ__Context__c: "Global",
                        enxCPQ__Col1__c: connection.getUsername() };
    
        return new Promise ((resolve, reject) => {
            connection.sobject("enxCPQ__CPQ_Settings__c").insert(data, function(err, rets) {
                if (err) {
                    reject('error disabling triggers: ' + err);
                    return;
                }
            
            Util.hideSpinner(' done. Setting ID: ' + rets['id']);
            resolve();
            });
        });      
    }

    public static async enableTriggers(connection: Connection, log:boolean=true) {
        return new Promise ((resolve, reject) => {
            if (log) Util.showSpinner('-- Enabling Triggers');

            connection.query("SELECT Id FROM enxCPQ__CPQ_Settings__c WHERE Name = 'G_CPQ_DISABLE_TRIGGERS_99'", {}, (err, res) => {
                if (res.records.length == 0) {
                    if (log) Util.hideSpinner(' done.');
                    resolve();
                }

                connection.sobject("enxCPQ__CPQ_Settings__c").del(res.records[0]['Id'], function(err, rets) {
                    if (err) {
                        reject('error enabling triggers: ' + err);
                        return;
                    }
                    
                    // @TO-DO check with Łuki, cause it's printed after '*** Finished ***'
                    if (log) Util.hideSpinner(' done.');
                    resolve();
                }); 
            });
        });      
    }

    private static extractIds(arr:any[]) {
        var targetArr = [];
        for (let i = 0; i < arr.length; i++) {
          targetArr.push(arr[i].Id);
        }
        return targetArr;
      } 
}