import { Serializable } from "./Serializable";

export class Charge extends Serializable {

    public record:any;
    public chargeElements:Array<any>;
    public chargeTiers:Array<any>;
    
    constructor(charge:any) {
        super();
        this.record = charge;
        this.chargeElements = [];
        this.chargeTiers = [];
    }

    public getFileName() {
        return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
    }

    public getRecordId(){
        return this.record['enxCPQ__TECH_External_Id__c'];
    }

    public getAllProductIds() {
        let result = [];
        result = [...result, this.record['enxCPQ__TECH_External_Id__c']];
        result = [...result, ...this.chargeElements.map(elem => {return elem['enxCPQ__TECH_External_Id__c']})];
        result = [...result, ...this.chargeTiers.map(tier => {return tier['enxCPQ__TECH_External_Id__c']})];
        return result;
    }

}