import {Serializable} from "../product/Serializable";

export class WorkflowItem extends Serializable {

  public record:any;

  constructor(workflowItem:any) {
    super();
    this.record = workflowItem;
  }

  public getWorkflowItemId() {
    return this.record['enxCPQ__TECH_External_Id__c'];
  }

  public getFileName() {
    return this.record['enxCPQ__TECH_External_Id__c']+ '.json'
  }
}
