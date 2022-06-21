import { Serializable } from "./Serializable";
export class Product extends Serializable {

    public record:any;
    public options:Array<any>;
    public charges:Array<any>;
    public productAttributes:Array<any>;
    public attributeValues:Array<any>;
    public attributeRules:Array<any>;
    public productRelationships:Array<any>;
    public attributeDefaultValues:Array<any>;
    public attributeValueDependencies:Array<any>;
    public bundleElements:Array<any>;
    public bundleElementOptions:Array<any>;
    public provisioningPlans:Array<any>;
    public resources:Array<any>;
    public priceRules:Array<any>;

    constructor(product:any) {
        super();
        this.record = product;
        this.options = [];
        this.charges = [];
        this.productAttributes = [];
        this.attributeValues = [];
        this.attributeRules = [];
        this.productRelationships = [];
        this.attributeDefaultValues = [];
        this.attributeValueDependencies = [];
        this.bundleElements = [];
        this.bundleElementOptions = [];
        this.provisioningPlans = [];
        this.resources = [];
        this.priceRules = [];
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

    public getProductResourceIds(){
        return this.resources.map((res) => {
            if (res['enxCPQ__Resource__r']) {
                return res['enxCPQ__Resource__r']['enxCPQ__TECH_External_Id__c'];
            }
        });
    }

    public getBundleElementIds() {
        return this.bundleElements.map((bel) => {
            return bel['enxCPQ__TECH_External_Id__c'];
        });
    }

    public getAttributeSetIds() {
        return this.productAttributes
                        .filter((attr) => {
                            return attr['enxCPQ__Attribute_Set__r'] !== undefined && attr['enxCPQ__Attribute_Set__r'] !== null
                        })
                        .map((attr) => {
                            return attr['enxCPQ__Attribute_Set__r']['enxCPQ__TECH_External_Id__c'];
                        });
    }

    public getProvisioningPlanIds() {
        return this.provisioningPlans.map((ppl) => {
            return ppl['enxB2B__Provisioning_Plan__r']['enxB2B__TECH_External_Id__c'];
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
            if (charge['enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c']) {
                return charge['enxCPQ__Charge_Reference__r.enxCPQ__TECH_External_Id__c'];
            } else {
                return charge['enxCPQ__TECH_External_Id__c'];
            }
        });
    }

    public getAllProductIds() {
        let result = [];
        result = [...result, this.getProductId()];
        result = [...result, ...this.options.map(opt => {return opt['enxCPQ__TECH_External_Id__c']})];
        result = [...result, ...this.charges.map(chg => {return chg['enxCPQ__TECH_External_Id__c']})];
        return result;
    }

    public getProducts() {
        return [this.record, ...this.options, ...this.charges];
    }
}
