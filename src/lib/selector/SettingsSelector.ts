import { Connection } from "@salesforce/core";
import { Query } from "./Query";

export class SettingsSelector {

    constructor() {
    }

    public async getAllSettings(connection: Connection) {
        const queryLabel = 'all settings';
        const query = "SELECT Name, enxCPQ__Setting_Name__c, enxCPQ__Context__c, \
                              enxCPQ__Col1__c, enxCPQ__Col2__c, enxCPQ__Col3__c, enxCPQ__Col4__c, enxCPQ__Col5__c, enxCPQ__Col6__c \
                         FROM enxCPQ__CPQ_Settings__c \
                     ORDER BY enxCPQ__Context__c, Name";

        const settings = await Query.executeQuery(connection, query, queryLabel);
        return settings;
    }
    
}