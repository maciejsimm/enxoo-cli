import { Serializable } from "./Serializable";
export class Resource extends Serializable {

    public record:any;
    
    constructor(resource:any) {
        super();
        this.record = resource;
    }

    public getFileName() {
        return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
    }

    public getRecordId(){
        return this.record['enxCPQ__TECH_External_Id__c'];
    }

    public getResources() {
        return [this.record];
    }

}