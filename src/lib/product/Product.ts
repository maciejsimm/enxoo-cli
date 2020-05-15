import { Serializable } from "./Serializable";

export class Product extends Serializable {

    public record:any;
    public options:Array<any>;
    public charges:Array<any>;
    public productAttributes:Array<any>;
    public attributeValues:Array<any>;
    
    constructor(product:any) {
        super();
        this.record = product;
        this.options = [];
        this.charges = [];
        this.productAttributes = [];
        this.attributeValues = [];
    }

    public getProductId() {
        return this.record['enxCPQ__TECH_External_Id__c'];
    }
    
    public getFileName() {
        return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
    }

    public getAttributeIds() {
        return this.productAttributes.map((attr) => {
            return attr['enxCPQ__Attribute__r']['enxCPQ__TECH_External_Id__c'];
        });
    }

    public getCategoryId() {
        if (this.record['enxCPQ__Category__r'] !== null) {
            return this.record['enxCPQ__Category__r']['enxCPQ__TECH_External_Id__c'];
        }
        return null;
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
}