import {Connection} from "@salesforce/core";
import {Query} from "./Query";
import {Schema} from "./Schema"
import {Utils} from "./Utils";

export class WorkflowSelector {
  private additionalFields: any;
  private fieldsToIgnore: any;

  constructor(querySettings: any = []) {
    this.additionalFields = querySettings.customFields ? querySettings.customFields : [];
    this.fieldsToIgnore = querySettings.fieldsToIgnore ? querySettings.fieldsToIgnore : [];
  }

  public async getWorkflowPlans(connection: Connection){
    const queryLabel = 'workflowPlan';

    const queryWorkflowPlans = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'WorkflowPlan').join(',') + " FROM enxCPQ__WorkflowPlan__c ";

    return await Query.executeQuery(connection, queryWorkflowPlans, 'Workflow Plans');
  }
  public async getWorkflowItems(connection: Connection){
    const queryLabel = 'workflowItem';

    const queryUnrelatedResources = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'WorkflowItem').join(',') + ", enxCPQ__Workflow_Plan__r.enxCPQ__TECH_External_Id__c, enxCPQ__Workflow_Task_Assignment__r.enxCPQ__TECH_External_Id__c \
                                        FROM enxCPQ__WorkflowItem__c ";

    return await Query.executeQuery(connection, queryUnrelatedResources, 'Workflow Items');
  }
  public async getWorkflowItemRules(connection: Connection){
    const queryLabel = 'workflowItemRule';

    const queryUnrelatedResources = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'WorkflowItemRule').join(',') + ", enxCPQ__Workflow_Item__r.enxCPQ__TECH_External_Id__c, enxCPQ__Depends_on_Workflow_Item__r.enxCPQ__TECH_External_Id__c \
                                        FROM enxCPQ__WorkflowItemRule__c ";

    return await Query.executeQuery(connection, queryUnrelatedResources, 'Workflow Item Rules');
  }
  public async getWorkflowTaskDefinitions(connection: Connection){
    const queryLabel = 'workflowTaskDefinition';

    const queryWorkflowTaskDefinitions = "SELECT " + this.getQueryFieldsReduced(queryLabel, 'WorkflowTaskDefinition').join(',') + ", OwnerId FROM enxCPQ__WorkflowTaskDefinition__c ";

    return await Query.executeQuery(connection, queryWorkflowTaskDefinitions, 'Workflow Task Definitions');
  }

  public async getRecordTypes(connection: Connection) {
    const queryLabel = 'recordTypes';
    const query = "SELECT Id, Name, DeveloperName, SObjectType \
                         FROM RecordType";

    const recordTypes = await Query.executeQuery(connection, query, queryLabel);

    return recordTypes.map((rt) => {
      return { Object: rt['SobjectType'], DeveloperName: rt['DeveloperName'], id: rt['Id'] };
    });
  }

  public getQueryFieldsReduced(queryLabel: string, schemaSetName: string) {
    const queryInject = this.additionalFields[queryLabel] || [];
    const queryFields = [...Schema[schemaSetName], ...queryInject];
    const queryFieldsDeduplicated = Utils.deduplicateQueryFields(queryFields);
    return queryFieldsDeduplicated.filter(e => {
      return this.fieldsToIgnore[queryLabel]?!this.fieldsToIgnore[queryLabel].includes(e) : true;
    });
  }

}
