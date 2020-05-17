import { Serializable } from "./Serializable";

export class Pricebook extends Serializable {

    public record:any;
    public isStandard:boolean;
    public pricebookEntries:any;       // object -> key -> product2 techId, value - list of pbes
    public stdPricebookEntries:any;    // object -> key -> product2 techId, value - list of pbes
    // public pbes:Array<any>;
    // public stdpbes:Array<any>;
    
    constructor(pricebook:any) {
        super();
        this.record = pricebook;
        this.isStandard = pricebook['IsStandard'];
        this.stdPricebookEntries = new Map<string, any>();
        this.pricebookEntries = new Map<string, any>();
        // this.pbes = [];
        // this.stdpbes = [];
    }

    public getPricebookId() {
        if (this.record['enxCPQ__TECH_External_Id__c'] !== null) {
            return this.record['enxCPQ__TECH_External_Id__c'];
        }
        return null;
    }

    public getFileName() {
        if (this.record['IsStandard'] === true) return this.record['Name'] +'_' + 'PRBSTANDARD.json';
        return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
    }

}