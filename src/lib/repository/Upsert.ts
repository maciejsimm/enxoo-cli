import { Connection } from "@salesforce/core";
import { Util } from './../Util';
import { RecordResult } from 'jsforce';
import * as fs from 'fs';
import { LogHandler as Logs } from './../LogHandler';

export class Upsert {
    public static reimportProduct2AfterCharges:Boolean;


    public static async upsertData(connection: Connection, records: Array<any>, sObjectName: string, sObjectLabel?: string, avoidBulk?: boolean) {
        const displayedObjectName = sObjectLabel || sObjectName;
        const messageString = '-- Upserting ' + displayedObjectName;
        Logs.showSpinner(messageString);
        //@TO-DO: Check the Pricebook Entries matcher - when querying before inserting.

        const externalIdString = (sObjectName.startsWith('enxB2B__') ? 'enxB2B__TECH_External_Id__c' : 'enxCPQ__TECH_External_Id__c');
        let sobjectsResult:Array<RecordResult> = new Array<RecordResult>();

        if (records.length < 200 || avoidBulk) {
            // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
            sobjectsResult = await connection.sobject(sObjectName).upsert(records, externalIdString, {}, (err, rets:RecordResult[]) => {
                if (err) {
                    Util.log(err);
                }
            });

        } else {
            // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
            sobjectsResult = await this.upsertBulkData(connection, records, sObjectName);

        }

        const errors = Logs.getErrors(sobjectsResult);

        await Logs.displayStatusMessage(sobjectsResult, messageString);

        if (errors.length > 0) {

            //errors is an array of objects (errorObject / errorElement) with array (singleError) of objects (property).
            //That's how it gets returned from sfdx API.
            const errorsModified = errors.map(errorElement => {

                //TO-DO: when more additional information are added, this anonymous function can be refactored into a separate function
                const errorObject = Object.values(errorElement).map(singleError => {
                    singleError.map(property => {
                        if (property.statusCode == 'METHOD_NOT_ALLOWED') {
                            property.enxooMessage = 'The system might be missing an external ID that is crucial for the upsert operation. Please check the data for the presence of TECH_External_Id__c Field.'
                        }
                        return property;
                    });
                    return singleError;
                });
                return errorObject;
            });

            if (sObjectName.includes("Product2")) {
                await Logs.showSpinner('-- Some errors were present during Product2 import. The import will repeat after charges are also imported.');
                Upsert.reimportProduct2AfterCharges = true;
            }

            await Util.warn(JSON.stringify(errorsModified, null, 2));
            // @TO-DO it would be great if error message could somehow indicate record ID where the app failed
            //          would be easier for debugging

            await Logs.showSpinner('-- Second attempt at upserting ' + sObjectName);

            await Logs.displayStatusMessage(sobjectsResult, messageString);

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
                    rets = [];
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
        Logs.showSpinner(messageString);

        let sobjectsResult:Array<RecordResult> = new Array<RecordResult>();

        // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
        sobjectsResult = await connection.sobject(sObjectName).insert(records, { allowRecursive: true }, (err: any, rets: any) => {
            if (err) {
                Util.log(err);
            }
        });

        const errors = Logs.getErrors(sobjectsResult);

        const warnings = Logs.getWarningsFromErrors(errors);

        const reducedErrors = Logs.reduceErrors(errors);

        await Logs.displayStatusMessage(sobjectsResult, messageString);

        if (errors.length > 0) {

            if (warnings && warnings.length > 0) {
                await Util.log(`${warnings.length} pricebook entries are already loaded into the org and cannot be further inserted nor upserted.`);
            }

            if (reducedErrors.length > 0) {

                await Util.warn(JSON.stringify(reducedErrors, null, 2));

                //05.08.2020 SZILN - ECPQ-4615 - after any failure on upsert or insert, the importer now
                //tries to repeat the operation.
                Util.showSpinner('-- Second attempt at inserting ' + sObjectName);

                // @ts-ignore
                sobjectsResult = await connection.sobject(sObjectName).insert(records, { allowRecursive: true }, (err, rets) => {
                    if (err) { Util.log(err); }
                });

                Logs.displayStatusMessage(sobjectsResult, messageString);
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

        const errors = Logs.getErrors(sobjectsResult);

        await Logs.displayStatusMessage(sobjectsResult, messageString);

        if (errors.length > 0) {
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

        const errors = Logs.getErrors(sobjectsResult);

        await Logs.displayStatusMessage(sobjectsResult, messageString);

        if (errors.length > 0) {
            await Util.warn(JSON.stringify(errors, null, 2));
        }
    }

    public static async disableTriggers(connection: Connection) {

        Util.showSpinner('-- Disabling triggers');

        await this.enableTriggers(connection, false);

        return new Promise ((resolve, reject) => {
            connection.query("SELECT Id FROM enxCPQ__CPQ_Settings__c WHERE enxCPQ__Setting_Name__c = 'CPQ_DISABLE_TRIGGERS'", {}, (err, res) => {
                if(err) {
                    reject('error disabling triggers: ' + err);
                    return;
                }
                const settingCounter = res.records.length + 1;
                let settingName = "G_CPQ_DISABLE_TRIGGERS_" + settingCounter;
                if(settingCounter < 10) { settingName = "G_CPQ_DISABLE_TRIGGERS_0" + settingCounter; }
    
                const data = { Name: settingName,
                    enxCPQ__Setting_Name__c: "CPQ_DISABLE_TRIGGERS",
                    enxCPQ__Context__c: "Global",
                    enxCPQ__Col1__c: connection.getUsername(),
                    enxCPQ__Col6__c: 'ENXOO_IMPORTER' };
    
                connection.sobject("enxCPQ__CPQ_Settings__c").insert(data, function(err, rets) {
                    if(err) {
                        reject('error disabling triggers: ' + err);
                        return;
                    }
    
                    Util.hideSpinner(' done. Setting ID: ' + rets['id']);
                    //@ts-ignore
                    resolve();
                });
            });
        });
    }

    public static async enableTriggers(connection: Connection, log:boolean=true) {
        return new Promise ((resolve, reject) => {
            if (log) Util.showSpinner('-- Enabling Triggers');

            connection.query("SELECT Id FROM enxCPQ__CPQ_Settings__c WHERE enxCPQ__Setting_Name__c = 'CPQ_DISABLE_TRIGGERS' AND enxCPQ__Col6__c = 'ENXOO_IMPORTER'", {}, (err, res) => {
                if (res.records.length == 0) {
                    if (log) Util.hideSpinner(' done.');
                    //@ts-ignore
                    resolve();
                }

                connection.sobject("enxCPQ__CPQ_Settings__c").del(res.records[0]['Id'], function(err, rets) {
                    if (err) {
                        reject('error enabling triggers: ' + err);
                        return;
                    }

                    // @TO-DO check with Łuki, cause it's printed after '*** Finished ***'
                    if (log) Util.hideSpinner(' done.');
                    //@ts-ignore
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

    private static async loadIgnoredFiles(queryDir: string) {
        return new Promise<String>((resolve: Function, reject: Function) => {
            let content;
            fs.readFile('./' + queryDir + '/fieldsToIgnroe.json', function read(err, data) {
                if (err) {
                    if (err.code == 'ENOENT') {
                        resolve({});
                    }
                    reject(err);
                } else {
                    content = data.toString('utf8');
                    resolve(JSON.parse(content));
                }
            });
        });
    }

}

