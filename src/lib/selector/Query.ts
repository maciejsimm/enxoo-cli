import { Connection } from "@salesforce/core";
import { Util } from './../Util';

export class Query {

    public static async executeQuery(connection: Connection, query: string, logLabel: string) {
        Util.showSpinner('-- Querying ' + logLabel);
        const recordResults = (await connection.autoFetchQuery(query)).records;
        Util.hideSpinner(' retrieved: ' + recordResults.length);
        return recordResults;
    }

    // public static async executeQuery(connection: Connection, query: string, logLabel: string) {
    //     return new Promise<String[]>((resolve: Function, reject: Function) => {
    //         Util.showSpinner('-- Querying ' + logLabel);
            
    //         connection.query(query, {}, (err, result) => { 
    //             if (err) {
    //                 Util.hideSpinner(' error!!!'); 
    //                 Util.warn(JSON.stringify(err, null, 2));
    //             }

    //             if (result.done) {
    //                 Util.hideSpinner(' retrieved: ' + result.records.length);
    //                 resolve(result.records);
    //             }
    //         });
    //     });
    // }

}