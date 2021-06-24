import { FileManager } from './../file/FileManager';
import { Connection } from "@salesforce/core";
import { Upsert } from './../repository/Upsert';
import { ApprovalRulesSelector } from '../selector/ApprovalRulesSelector';

export class ApprovalRulesImport {

    private connection:Connection;
    private fileManager:FileManager;
    private targetDirectory:string;

    constructor(targetDirectory:string, connection: Connection) {
        this.targetDirectory = targetDirectory;
        this.fileManager = new FileManager(targetDirectory);
        this.connection = connection;
    }

    public async import() {

        const approvalRules = await this.getApprovalRules();
        const approvalRuleConditions = await this.getApprovalRuleConditions();

        const queryApprovalRules = await this.fileManager.loadQueryConfiguration(this.targetDirectory);
        const approvalRulesSelector = new ApprovalRulesSelector(queryApprovalRules);
        
        await Upsert.upsertData(this.connection, approvalRules, 'enxCPQ__ApprovalRule__c', 'Approval Rules');
        await Upsert.upsertData(this.connection, approvalRuleConditions, 'enxCPQ__ApprovalRuleCondition__c', 'Approval Rule Conditions');
    }

    private async getApprovalRules() {
        const approvalRulesInputReader = await this.fileManager.readFile('approvalRules', 'approvalRules.json');
        const approvalRulesString:string = approvalRulesInputReader.toString();
        const approvalRules = JSON.parse(approvalRulesString);
        return approvalRules;
    }

    private async getApprovalRuleConditions() {
        const approvalRuleConditionsInputReader = await this.fileManager.readFile('approvalRules', 'approvalRuleConditions.json');
        const approvalRuleConditionsString:string = approvalRuleConditionsInputReader.toString();
        const approvalRuleConditions = JSON.parse(approvalRuleConditionsString);
        return approvalRuleConditions;
    }

}
