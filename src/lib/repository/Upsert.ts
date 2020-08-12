import { Connection } from "@salesforce/core";
import { Util } from './../Util';
import { RecordResult } from 'jsforce';

export class Upsert {
    public static async upsertData(connection: Connection, records: Array<any>, sObjectName: string) {
        const messageString = '-- Upserting ' + sObjectName;
        Util.showSpinner(messageString);
        
        const externalIdString = (sObjectName.startsWith('enxB2B__') ? 'enxB2B__TECH_External_Id__c' : 'enxCPQ__TECH_External_Id__c');
        let sobjectsResult:Array<RecordResult> = new Array<RecordResult>();

        let failedResults: Array<RecordResult> = new Array<RecordResult>();
        let failedRecords: Array<any> = new Array<any>();
        
        let warnings: Array<any> = new Array<any>();

        if (records.length < 200) {
            // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
            sobjectsResult = await connection.sobject(sObjectName).upsert(records, externalIdString, {}, (err, rets:RecordResult[]) => {
                if (err) { 
                    Util.log(err); 
                }
            });

            failedResults = sobjectsResult.filter(e => e.success === false);
            if (failedResults.length > 0) {
                failedRecords.push(...records);
            }

        } else {
            // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
            sobjectsResult = await this.upsertBulkData(connection, records, sObjectName);

            failedResults = sobjectsResult.filter(e => e.success === false);
            if (failedResults.length > 0) {
                //@TO-DO : filter only the records that were failed - after the failed IDs are added to reports
                failedRecords.push(...records);
            }

        }

        const successCount = sobjectsResult.map((r): number => { return (r.success ? 1 : 0) })
            .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal });

        const errorCount = sobjectsResult.map((r): number => { return (r.success ? 0 : 1) })
            .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal });


        const errors = sobjectsResult.filter((elem) => {
            return elem.success === false;
        }).map((elem) => {
            return { "error": elem['errors'] };
        });

        const initialTabbing = (messageString.length > 21) ? (messageString.length > 29) ? (messageString.length > 37) ? (messageString.length > 45) ?  '\t' : '\t\t' : '\t\t\t' : '\t\t\t\t' : '\t\t\t\t\t';
        
        await Util.hideSpinner(' done.' + initialTabbing + 'Success: ' + successCount + '\t' + 'Errors: ' + errors.length + '\t' + 'Warnings: ' + warnings.length);
        
        if (errorCount > 0) {

            await Util.warn(JSON.stringify(errors, null, 2));
            // @TO-DO it would be great if error message could somehow indicate record ID where the app failed
            //          would be easier for debugging

            Util.showSpinner('-- Second attempt at upserting ' + sObjectName);

            if (failedRecords.length > 0) {
                //05.08.2020 SZILN - ECPQ-4615 - after any failure on upsert or insert, the importer now 
                //tries to repeat the operation.
                sobjectsResult = await connection.sobject(sObjectName).upsert(records, externalIdString, {}, (err, rets: RecordResult[]) => {
                    if (err) {
                        Util.log(err);
                    }
                });
            }

            const successCount = sobjectsResult.map((r): number => { return (r.success ? 1 : 0) })
                .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal });

            const errorCount = sobjectsResult.map((r): number => { return (r.success ? 0 : 1) })
                .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal });

            await Util.hideSpinner(' done. Success: ' + successCount + ', errors: ' + errorCount);
        }

    }

    public static async upsertBulkData(connection: Connection, records: Array<any>, sObjectName: string) {
        let sobjectsResult:Array<RecordResult> = new Array<RecordResult>();
        const externalIdString = (sObjectName.startsWith('enxB2B__') ? 'enxB2B__TECH_External_Id__c' : 'enxCPQ__TECH_External_Id__c');
        const dataToImport = Util.sanitizeForBulkImport(records);

        // @TO-DO - proposed by Łuki - it's a better implementation of handling callbacks

        // const someFunc = () => {
        //     return new Promise<String[]>((resolve: Function, reject: Function) => {
        //         connection.bulk.load(sObjectName, "upsert", {"extIdField": externalIdString}, dataToImport, (err:any, rets:RecordResult[]) => {
        //             resolve();
        //         });
        //     });
        // };

        // await someFunc();
        
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            connection.bulk.pollTimeout = 250000;
            connection.bulk.load(sObjectName, "upsert", {"extIdField": externalIdString}, dataToImport, async (err:any, rets:RecordResult[]) => {
                if (err) { 
                    Util.log(err); 
                }

                await rets.forEach(async (ret) => {
                    sobjectsResult.push(ret);
                })

                resolve(sobjectsResult);
            });
        });
    }

    public static async insertData(connection: Connection, records: Array<any>, sObjectName: string) {
        const messageString = '-- Inserting ' + sObjectName;
        Util.showSpinner(messageString); 

        let sobjectsResult:Array<RecordResult> = new Array<RecordResult>();

        let failedResults: Array<RecordResult> = new Array<RecordResult>();
        let failedRecords: Array<any> = new Array<any>();

        let warnings: Array<any> = new Array<any>();

        // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
        sobjectsResult = await connection.sobject(sObjectName).insert(records, { allowRecursive: true }, (err: any, rets: any) => {
            if (err) { 
                Util.log(err); 
            }
            if (rets) {
                //debugger;
            }
        });

        failedResults = sobjectsResult.filter(e => e.success === false);
        if (failedResults.length > 0) {
            //@TO-DO : filter only the records that were failed
            failedRecords.push(...records);
        }

        const errors = sobjectsResult.filter((elem) => {
            return elem.success === false;
        }).map((elem) => {
            return { "error": elem['errors'] };
        });

        const pricebookWarnings = errors.map(e => {
            return e.error;
        }).map(el => {
            return el[0].message;
        }).filter(elem => elem.includes("This price definition already exists in this price book"));

        warnings.push(...pricebookWarnings);

        const reducedErrors = errors.filter(val => {
            let error = val.error.some(({ message }) => !message.includes("This price definition already exists in this price book"))
            return error
        });

        const successCount = sobjectsResult.map((r): number => { return (r.success ? 1 : 0) })
            .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal });

        const errorCount = sobjectsResult.map((r): number => { return (r.success ? 0 : 1) })
            .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal });

        const initialTabbing = (messageString.length > 21) ? (messageString.length > 29) ? (messageString.length > 37) ? (messageString.length > 45) ? '\t' : '\t\t' : '\t\t\t' : '\t\t\t\t' : '\t\t\t\t\t';

        await Util.hideSpinner(' done.' + initialTabbing + 'Success: ' + successCount + '\t' + 'Errors: ' + reducedErrors.length + '\t' + 'Warnings: ' + warnings.length);

        if (errorCount > 0) {

            if (pricebookWarnings && pricebookWarnings.length > 0) {
                await Util.log(`${pricebookWarnings.length} pricebook entries are already loaded into the org and cannot be further inserted nor upserted.`);
            }

            if (reducedErrors.length > 0) {

                await Util.warn(JSON.stringify(reducedErrors, null, 2));

                //05.08.2020 SZILN - ECPQ-4615 - after any failure on upsert or insert, the importer now
                //tries to repeat the operation.
                Util.showSpinner('-- Second attempt at inserting ' + sObjectName);

                sobjectsResult = await connection.sobject(sObjectName).insert(records, { allowRecursive: true }, (err, rets) => {
                    if (err) { Util.log(err); }
                });

                const successCount = sobjectsResult.map((r): number => { return (r.success ? 1 : 0) })
                    .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal });

                const errorCount = sobjectsResult.map((r): number => { return (r.success ? 0 : 1) })
                    .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal });

                await Util.hideSpinner(' done. Success: ' + successCount + ', errors: ' + errorCount);
            }
        }
    }

    public static async updateData(connection: Connection, records: Array<any>, sObjectName: string) {
        const messageString = '-- Updating ' + sObjectName;
        Util.showSpinner(messageString);
        let sobjectsResult:Array<RecordResult> = new Array<RecordResult>();

        // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
        sobjectsResult = await connection.sobject(sObjectName).update(records, { allowRecursive: true }, (err, rets) => {
            if (err) { Util.log(err); }
        });

        const successCount = sobjectsResult.map((r):number => {return (r.success ? 1 : 0)})
                                        .reduce((prevVal:number, nextVal:number) => {return prevVal+nextVal});

        const errorCount = sobjectsResult.map((r): number => { return (r.success ? 0 : 1) })
            .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal });

        const initialTabbing = (messageString.length > 21) ? (messageString.length > 29) ? (messageString.length > 37) ? (messageString.length > 45) ? '\t' : '\t\t' : '\t\t\t' : '\t\t\t\t' : '\t\t\t\t\t';

        await Util.hideSpinner(' done.' + initialTabbing + 'Success: ' + successCount + '\t' + 'Errors: ' + errorCount + '\t' + 'Warnings:');

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
        const messageString = '-- Deleting ' + sObjectName;
        Util.showSpinner(messageString);
        let sobjectsResult:Array<RecordResult> = new Array<RecordResult>();
        const data = this.extractIds(records);

        let warnings: Array<any> = new Array<any>();

        // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
        sobjectsResult = await connection.sobject(sObjectName).del(data, { allowRecursive: true }, (err, rets) => {
            if (err) { Util.log(err); }
        });

        const errors = sobjectsResult.filter((elem) => {
            return elem.success === false;
        }).map((elem) => {
            return { "error": elem['errors'] };
        });

        const successCount = sobjectsResult.map((r): number => { return (r.success ? 1 : 0) })
            .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal });

        const errorCount = sobjectsResult.map((r): number => { return (r.success ? 0 : 1) })
            .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal });

        const initialTabbing = (messageString.length > 21) ? (messageString.length > 29) ? (messageString.length > 37) ? (messageString.length > 45) ? '\t' : '\t\t' : '\t\t\t' : '\t\t\t\t' : '\t\t\t\t\t';

        await Util.hideSpinner(' done.' + initialTabbing + 'Success: ' + successCount + '\t' + 'Errors: ' + errors.length + '\t' + 'Warnings: ' + warnings.length);

        if (errorCount > 0) {
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

module recordId {
    export class recordId {
        salesforceId:string;
        enxooId:string;
    }
        
    }
