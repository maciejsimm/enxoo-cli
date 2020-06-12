import { Connection } from "@salesforce/core";
import { Util } from './../Util';
import { resolve } from "dns";

export class Query {

    public static async executeQuery(connection: Connection, query: string, logLabel: string, recordsCount?: number) {
        if (recordsCount === undefined || recordsCount < 200) {
            Util.showSpinner('-- Querying ' + logLabel);
            const recordResults = (await connection.autoFetchQuery(query)).records;
            Util.hideSpinner(' retrieved: ' + recordResults.length);
            return recordResults;
        } else {
            return this.executeBulkQuery(connection, query, logLabel);
        }
    }

    public static async executeBulkQuery(connection: Connection, query: string, logLabel: string) {
        return new Promise<String[]>(async (resolve: Function, reject: Function) => {
            Util.showSpinner('-- Querying bulk ' + logLabel);

            let records = []; 
            connection.bulk.pollTimeout = 250000;
            await connection.bulk.query(query)
                                .on('record', record => {
                                    records.push(this.fixIdsForBulk(record));
                                })
                                .on('error', error => {
                                    console.log(error); 
                                })
                                .on('end', info => {
                                    Util.hideSpinner(' retrieved: ' + records.length);
                                    resolve(records);
                                })
        });
    }

    private static fixIdsForBulk(record:any) {
        // Bulk API query doesn't return objects, nested properties are one string
        if (record.hasOwnProperty('Product2.enxCPQ__TECH_External_Id__c')) {
            record['Product2'] = {};
            record['Product2']['enxCPQ__TECH_External_Id__c'] = record['Product2.enxCPQ__TECH_External_Id__c'];
            delete record['Product2.enxCPQ__TECH_External_Id__c'];
        }
        if (record.hasOwnProperty('Pricebook2.enxCPQ__TECH_External_Id__c')) {
            record['Pricebook2'] = {};
            record['Pricebook2']['enxCPQ__TECH_External_Id__c'] = record['Pricebook2.enxCPQ__TECH_External_Id__c'];
            delete record['Pricebook2.enxCPQ__TECH_External_Id__c'];
        }
        // Bulk API query doesn't return null values, it returns empty string instead
        for(let prop in record) {
            if (record[prop] === '') {
                record[prop] = null;
            }
        }
        return record;
    }

}