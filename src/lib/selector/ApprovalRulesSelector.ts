import { Connection } from "@salesforce/core";
import { Query } from "./Query";

export class ApprovalRulesSelector {
  private rulesToIgnore: any;
  private ruleConditionsToIgnore: any;

    constructor(queryApprovalRules: any = []) {
      this.rulesToIgnore = queryApprovalRules.rulesToIgnore ? queryApprovalRules.rulesToIgnore['ruleName'] : [];
      this.ruleConditionsToIgnore = queryApprovalRules.ruleConditionsToIgnore ? queryApprovalRules.ruleConditionsToIgnore['ruleConditionName'] : [];
    }

    public async getAllApprovalRules(connection: Connection) {
        const queryLabel = 'all approval rules';
        const query = "SELECT name, enxCPQ__Active__c, enxCPQ__Approval_Level__c, enxCPQ__Approval_Level_Field__c, \
                         enxCPQ__Conditions_Logic__c, enxCPQ__Object_Type__c, enxCPQ__Order__c, enxCPQ__Product__c, enxCPQ__TECH_Definition_Id__c, enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__ApprovalRule__c \
                         WHERE Name NOT IN ('" + this.rulesToIgnore.join('\',\'') + "') \
                     ORDER BY Name";

        const approvalRules = await Query.executeQuery(connection, query, queryLabel);
        return approvalRules;
    }

    public async getAllApprovalRuleIds(connection: Connection) {
        const queryLabel = 'all approval rules\' ID\'s';
        const query = "SELECT Id, enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__ApprovalRule__c \
                         WHERE name NOT IN ('" + this.rulesToIgnore.join('\',\'') + "')";

        const approvalRules = await Query.executeQuery(connection, query, queryLabel);
        return approvalRules;
    }

    public async getAllRuleConditions(connection: Connection) {
        const queryLabel = 'all approval rule conditions';
        const query = "SELECT name, enxCPQ__Approval_Rule__r.enxCPQ__TECH_External_Id__c,  \
                         enxCPQ__Child_Object__c, enxCPQ__Field_Name__c, enxCPQ__Operator__c, \
                         enxCPQ__Order__c, enxCPQ__Parent_Object__c, enxCPQ__Value__c, enxCPQ__TECH_External_Id__c \
                         FROM enxCPQ__ApprovalRuleCondition__c \
                         WHERE Name NOT IN ('" + this.ruleConditionsToIgnore.join('\',\'') + "') \
                     ORDER BY Name";

        const approvalRuleConditions = await Query.executeQuery(connection, query, queryLabel);
        return approvalRuleConditions;
    }

    public async getAllRuleConditionIds(connection: Connection) {
        const queryLabel = 'all approval rule conditions\' ID\'s';
        const query = "SELECT Id \
                         FROM enxCPQ__ApprovalRuleCondition__c \
                         WHERE name NOT IN ('" + this.ruleConditionsToIgnore.join('\',\'') + "')";

        const approvalRules = await Query.executeQuery(connection, query, queryLabel);
        return approvalRules;
    }
}
