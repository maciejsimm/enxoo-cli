import { Serializable } from "./Serializable";
export class Attribute extends Serializable {

    public record:any;
    public attributeValues:Array<any>;
    
    constructor(attribute:any) {
        super();
        this.record = attribute;
        this.attributeValues = [];
    }

    public getFileName() {
        return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
    }

}