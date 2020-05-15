import { Serializable } from "./Serializable";

export class Category extends Serializable {

    public record:any;
    
    constructor(category:any) {
        super();
        this.record = category;
    }

    public getFileName() {
        return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
    }

    public getParentCategory() {
        if (this.record['enxCPQ__Parent_Category__r'] !== null) {
            return this.record['enxCPQ__Parent_Category__r']['enxCPQ__TECH_External_Id__c'];
        }
        return null;
    }
    
}