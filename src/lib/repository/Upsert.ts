import { Connection } from "@salesforce/core";
import { Util } from './../Util';

import { RecordResult } from 'jsforce';

export class Upsert {

    public static async upsertData(connection: Connection, records: Array<any>, sObjectName: string) {
        Util.showSpinner('-- Upserting ' + sObjectName);
        let sobjectsResult:Array<RecordResult> = new Array<RecordResult>();

        // @ts-ignore: Don't know why, but TypeScript doesn't use the correct method override
        sobjectsResult = await connection.sobject(sObjectName).upsert(records, 'enxCPQ__TECH_External_Id__c', {}, (err, rets) => {
            if (err) { Util.log(err); }
        });

        const successCount = sobjectsResult.map((r):number => {return (r.success ? 1 : 0)})
                                        .reduce((prevVal:number, nextVal:number) => {return prevVal+nextVal});

        const errorCount = sobjectsResult.map((r):number => {return (r.success ? 0 : 1)})
                                        .reduce((prevVal:number, nextVal:number) => {return prevVal+nextVal});

        Util.hideSpinner(' done. Success: ' + successCount + ', errors: ' + errorCount);

        if (errorCount > 0) {
            sobjectsResult.forEach((r) => {
                if (r.success === false) {
                    Util.warn(JSON.stringify(r.errors).substring(0,150));
                }
            })
        }

        return 'finished';
    }

}