import { Serializable } from "./Serializable";
export class PriceRule extends Serializable {

  public record:any;
  public priceRuleCondition:Array<any>;
  public priceRuleAction:Array<any>;

  constructor(priceRule:any) {
    super();
    this.record = priceRule;
    this.priceRuleCondition = [];
    this.priceRuleAction = [];
  }

  public getFileName() {
    return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
  }

  public getRecordId(){
    return this.record['enxCPQ__TECH_External_Id__c'];
  }
}
