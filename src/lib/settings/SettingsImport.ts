import { FileManager } from './../file/FileManager';
import { Connection } from "@salesforce/core";
import { Upsert } from './../repository/Upsert';

export class SettingsImport {

    private connection:Connection;
    private fileManager:FileManager;

    constructor(targetDirectory:string, connection: Connection) {
        this.fileManager = new FileManager(targetDirectory);
        this.connection = connection;
    }

    public async import() {

        const settings = await this.getSettings();

        // @to-do this is prone to error, settings should be cleared first in order not to create duplicates
        await Upsert.insertData(this.connection, settings, 'enxCPQ__CPQ_Settings__c');

    }

    private async getSettings() {
        const settingsInputReader = await this.fileManager.readFile('settings', 'settings.json');
        const settingsString:string = settingsInputReader.toString();
        const settings = JSON.parse(settingsString);
        return settings;
    }

}