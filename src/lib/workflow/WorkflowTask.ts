import {Serializable} from "../product/Serializable";

export class WorkflowTask extends Serializable {

  public record:any;

  constructor(workflowTask:any) {
    super();
    this.record = workflowTask;
  }

  public getWorkflowTaskId() {
    return this.record['enxCPQ__TECH_External_Id__c'];
  }

  public getFileName() {
    return this.record['enxCPQ__TECH_External_Id__c']+ '.json'
  }
}
