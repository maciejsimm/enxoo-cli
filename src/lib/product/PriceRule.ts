import { Serializable } from "./Serializable";
import {PriceRuleCondition} from "./PriceRuleCondition";
import {PriceRuleAction} from "./PriceRuleAction";
export class PriceRule extends Serializable {

  public record:any;
  public priceRuleCondition:Array<PriceRuleCondition>;
  public priceRuleAction:Array<PriceRuleAction>;

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
