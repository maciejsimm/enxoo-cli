import { Serializable } from "./Serializable";

export class AttributeSet extends Serializable {

    public record:any;
    public setAttributes:Array<any>;
    
    constructor(attributeSet:any) {
        super();
        this.record = attributeSet;
        this.setAttributes = [];
    }
    
    public getRecordId(){
        return this.record['enxCPQ__TECH_External_Id__c'];
    }

    public getFileName() {
        return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
    }

}