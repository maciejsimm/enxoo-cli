import { FileManager } from './../file/FileManager';
import { Connection } from "@salesforce/core";
import { ApprovalRulesSelector } from '../selector/ApprovalRulesSelector';

export class ApprovalRulesExport {

    private connection:Connection;
    private fileManager:FileManager;
    private targetDirectory:string;

    constructor(targetDirectory:string, connection: Connection) {
        this.targetDirectory = targetDirectory;
        this.fileManager = new FileManager(targetDirectory);
        this.connection = connection;
    }

    public async export() {
        const queryApprovalRules = await this.fileManager.loadQueryConfiguration(this.targetDirectory);
        const approvalRulesSelector = new ApprovalRulesSelector(queryApprovalRules);
        const allApprovalRules = await approvalRulesSelector.getAllApprovalRules(this.connection);
        const allApprovalRuleConditions = await approvalRulesSelector.getAllRuleConditions(this.connection);

        this.fileManager.createDirectoriesForExport();

        await this.fileManager.writeFile('approvalRules', 'approvalRules.json', allApprovalRules);
        await this.fileManager.writeFile('approvalRules', 'approvalRuleConditions.json', allApprovalRuleConditions);
    }
}
