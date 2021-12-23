import {Serializable} from "../product/Serializable";

export class WorkflowTaskDef extends Serializable {

  public record:any;

  constructor(workflowTaskDef:any) {
    super();
    this.record = workflowTaskDef;
  }

  public getWorkflowTaskDefId() {
    return this.record['enxCPQ__TECH_External_Id__c'];
  }

  public getFileName() {
    return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
  }
}
