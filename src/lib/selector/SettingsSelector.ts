import { Connection } from "@salesforce/core";
import { Query } from "./Query";

export class SettingsSelector {
  private settingsToIgnore: any;

    constructor(querySettings: any = []) {
      this.settingsToIgnore = querySettings.settingsToIgnore ? querySettings.settingsToIgnore['settingName'] : [];
    }

    public async getAllSettings(connection: Connection) {
        const queryLabel = 'all settings';
        const query = "SELECT Name, enxCPQ__Setting_Name__c, enxCPQ__Context__c, \
                              enxCPQ__Col1__c, enxCPQ__Col2__c, enxCPQ__Col3__c, enxCPQ__Col4__c, enxCPQ__Col5__c, enxCPQ__Col6__c \
                         FROM enxCPQ__CPQ_Settings__c \
                         WHERE enxCPQ__Setting_Name__c NOT IN ('" + this.settingsToIgnore.join('\',\'') + "') \
                     ORDER BY enxCPQ__Context__c, Name";

        const settings = await Query.executeQuery(connection, query, queryLabel);
        return settings;
    }

    public async getAllSettingIds(connection: Connection) {
        const queryLabel = 'all settings';
        const query = "SELECT Id \
                         FROM enxCPQ__CPQ_Settings__c \
                         WHERE enxCPQ__Setting_Name__c NOT IN ('" + this.settingsToIgnore.join('\',\'') + "')";

        const settings = await Query.executeQuery(connection, query, queryLabel);
        return settings;
    }
}
