import {Serializable} from "../product/Serializable";

export class WorkflowItemRule extends Serializable {

  public record:any;

  constructor(workflowItemRule:any) {
    super();
    this.record = workflowItemRule;
  }

  public getWorkflowItemRuleId() {
    return this.record['enxCPQ__TECH_External_Id__c'];
  }

  public getFileName() {
    return this.record['enxCPQ__TECH_External_Id__c']+ '.json'
  }
}
