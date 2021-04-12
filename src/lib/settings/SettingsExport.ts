import { FileManager } from './../file/FileManager';
import { Connection } from "@salesforce/core";
import { SettingsSelector } from '../selector/SettingsSelector';

export class SettingsExport {

    private connection:Connection;
    private fileManager:FileManager;
    private targetDirectory:string;

    constructor(targetDirectory:string, connection: Connection) {
        this.targetDirectory = targetDirectory;
        this.fileManager = new FileManager(targetDirectory);
        this.connection = connection;
    }

    public async export() {
        const querySettings = await this.fileManager.loadQueryConfiguration(this.targetDirectory);
        const settingsSelector = new SettingsSelector(querySettings);
        const allSettings = await settingsSelector.getAllSettings(this.connection);

        this.fileManager.createDirectoriesForExport();

        await this.fileManager.writeFile('settings', 'settings.json', allSettings);
    }
}
