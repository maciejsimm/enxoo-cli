import { Serializable } from "./Serializable";
export class Resource extends Serializable {

    public record:any;
    public RecordTypeId:any;
    public charges:Array<any>;
    public productResources:Array<any>;

    constructor(resource:any) {
        super();
        this.record = resource;
        this.productResources = [];
        this.charges = [];
        this.RecordTypeId = '';
    }

    public getFileName() {
        return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
    }

  public getChargeIds() {
    return this.charges.map((charge) => {
      if (charge['enxCPQ__Charge_Reference__r'] !== null) {
        return charge['enxCPQ__Charge_Reference__r']['enxCPQ__TECH_External_Id__c'];
      } else {
        return charge['enxCPQ__TECH_External_Id__c'];
      }
    });
  }

    public getRecordId(){
        return this.record['enxCPQ__TECH_External_Id__c'];
    }

    public getResources() {
        return [this.record];
    }

    public getCategoryId() {
        if (this.record.enxCPQ__Category__r && this.record.enxCPQ__Category__r.enxCPQ__TECH_External_Id__c) {
            return this.record['enxCPQ__Category__r']['enxCPQ__TECH_External_Id__c'];
        }
        return null;
    }

}
