import { Connection } from "@salesforce/core";
import { Util } from './../Util';

export class Query {

    public static async executeQuery(connection: Connection, query: string, logLabel: string) {
        Util.showSpinner('-- Querying ' + logLabel);
        const recordResults = (await connection.autoFetchQuery(query)).records;
        Util.hideSpinner(' retrieved: ' + recordResults.length);
        return recordResults;
    }

}