import { Serializable } from "./Serializable";
export class Resource extends Serializable {

    public record:any;
    public RecordTypeId:any;
    public productResources:Array<any>;
    
    constructor(resource:any) {
        super();
        this.record = resource;
        this.productResources = [];
        this.RecordTypeId = '';
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

    public getCategoryId() {
        if (this.record.enxCPQ__Category__r && this.record.enxCPQ__Category__r.enxCPQ__TECH_External_Id__c) {
            return this.record['enxCPQ__Category__r']['enxCPQ__TECH_External_Id__c'];
        }
        return null;
    }

}