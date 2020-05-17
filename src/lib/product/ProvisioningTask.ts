import { Serializable } from "./Serializable";

export class ProvisioningTask extends Serializable {

    public record:any;
    
    constructor(attribute:any) {
        super();
        this.record = attribute;
    }

    public getFileName() {
        return this.record['Name'] +'_' + this.record['enxB2B__TECH_External_Id__c']+ '.json'
    }

}