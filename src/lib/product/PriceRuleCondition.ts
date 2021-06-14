import { Serializable } from "./Serializable";
export class PriceRuleCondition extends Serializable {

  public record:any;

  constructor(priceRuleCondition:any) {
    super();
    this.record = priceRuleCondition;
  }

  public getFileName() {
    return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
  }

  public getRecordId(){
    return this.record['enxCPQ__TECH_External_Id__c'];
  }
}
