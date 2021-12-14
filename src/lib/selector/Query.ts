import { Connection } from "@salesforce/core";
import { LogHandler as Logs } from './../LogHandler';
import { ExecuteOptions } from 'jsforce/query'
import { fail } from "assert";

export class Query {

    public static async executeQuery(connection: Connection, query: string, logLabel: string, recordsCount?: number) {
        if (recordsCount === undefined || recordsCount < 200) {
            const messageString = '-- Querying ' + logLabel;
            Logs.showSpinner(messageString);
            let queryOptions: ExecuteOptions = { maxFetch: 50000 };
            try {
                const recordResults = (await connection.autoFetchQuery(query, queryOptions)).records;
                Logs.hideSpinner(Logs.prettifyUpsertMessage(messageString, 3) + 'Retrieved: ' + recordResults.length);
                return recordResults;
            } catch (error) {
              if(error.errorCode === 'INVALID_TYPE'){
                throw error;
              } else {
                const errorWithComments = Logs.addEnxooMessages(error);
                Logs.displayError(errorWithComments);
                console.log('Error during query execution. Importer will now exit the operation.');
                process.exit(1);
              }
            }
        } else {
            return this.executeBulkQuery(connection, query, logLabel);
        }
    }

    public static async executeBulkQuery(connection: Connection, query: string, logLabel: string) {
        return new Promise<String[]>(async (resolve: Function, reject: Function) => {
            const messageString = '-- Querying bulk ' + logLabel;
            Logs.showSpinner(messageString);
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
                    Logs.hideSpinner(Logs.prettifyUpsertMessage(messageString, 3) + 'Retrieved: ' + records.length);
                    resolve(records);
                })
        });
    }

    private static fixIdsForBulk(record: any) {
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
        for (let prop in record) {
            if (record[prop] === '') {
                record[prop] = null;
            }
        }
        return record;
    }

}
