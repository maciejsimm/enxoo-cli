import { FileManager } from './../file/FileManager';
import { Connection } from "@salesforce/core";
import { SettingsSelector } from '../selector/SettingsSelector';

export class SettingsExport {

    private connection:Connection;
    private fileManager:FileManager;

    constructor(targetDirectory:string, connection: Connection) {
        this.fileManager = new FileManager(targetDirectory);
        this.connection = connection;
    }

    public async export() {
        const settingsSelector = new SettingsSelector();
        const allSettings = await settingsSelector.getAllSettings(this.connection);
        
        this.fileManager.createDirectoriesForExport();

        await this.fileManager.writeFile('settings', 'settings.json', allSettings);
    }
}