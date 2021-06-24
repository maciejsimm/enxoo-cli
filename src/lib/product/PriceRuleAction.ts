import { Serializable } from "./Serializable";
export class PriceRuleAction extends Serializable {

  public record:any;

  constructor(priceRuleAction:any) {
    super();
    this.record = priceRuleAction;
  }

  public getFileName() {
    return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
  }

  public getRecordId(){
    return this.record['enxCPQ__TECH_External_Id__c'];
  }
}
