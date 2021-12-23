import {Serializable} from "../product/Serializable";

export class WorkflowPlan extends Serializable {

  public record:any;

  constructor(workflowPlan:any) {
    super();
    this.record = workflowPlan;
  }

  public getWorkflowPlanId() {
    return this.record['enxCPQ__TECH_External_Id__c'];
  }

  public getFileName() {
    return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
  }
}
