import {Serializable} from "../product/Serializable";

export class Workflow extends Serializable {

  public record:any;

  constructor(workflow:any) {
    super();
    this.record = workflow;
  }

  public getWorkflowId() {
    return this.record['enxCPQ__TECH_External_Id__c'];
  }

  public getFileName() {
    return this.record['enxCPQ__TECH_External_Id__c']+ '.json'
  }
}
