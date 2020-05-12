export class Charge {

    public record:any;
    public chargeElements:Array<any>;
    public chargeTiers:Array<any>;
    
    constructor(charge:any) {
        this.record = charge;
        this.chargeElements = [];
        this.chargeTiers = [];
    }

    public getFileName() {
        return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
    }

}