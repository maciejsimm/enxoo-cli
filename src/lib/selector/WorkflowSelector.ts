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

    const workflowTasks = await Query.executeQuery(connection, queryWorkflowTaskDefinitions, 'Workflow Task Definitions');
    this.setOwnerFieldOnWorkflowTask(connection, workflowTasks);
    return workflowTasks;
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

  private async setOwnerFieldOnWorkflowTask(connection: Connection, tasks: Array<any>) {
    const ownerIds = new Set();
    // @ts-ignore
    tasks.forEach(task => ownerIds.add(task.OwnerId));
    const userQuery = "SELECT Id, Email FROM User WHERE Id IN ('" + Array.from(ownerIds).join('\',\'') + "')";
    const queueQuery = "SELECT Id, Name FROM Group WHERE Type = 'Queue' AND Id IN ('" + Array.from(ownerIds).join('\',\'') + "')";
    const users = await Query.executeQuery(connection, userQuery, 'provisioning task user owner');
    const queues = await Query.executeQuery(connection, queueQuery, 'provisioning task queue owner');
    let usersMap = new Map();
    // @ts-ignore
    users.forEach(u => usersMap.set(u.Id, u.Email))
    let queuesMap = new Map();
    // @ts-ignore
    queues.forEach(q => queuesMap.set(q.Id, q.Name))
    for(let task of tasks){
      // @ts-ignore
      let email = usersMap.get(task.OwnerId);
      let name = queuesMap.get(task.OwnerId);
      if(email){
        // @ts-ignore
        task.OwnerEmail = email;
      } else if(name){
        // @ts-ignore
        task.OwnerQueue = name;
      }
      delete task.OwnerId;
    }
  }

}
