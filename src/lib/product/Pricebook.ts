import { Serializable } from "./Serializable";

export class Pricebook extends Serializable {

    public record:any;
    public isStandard:boolean;
    public pricebookEntries:any;       // object -> key -> product2 techId, value - list of pbes
    public stdPricebookEntries:any;    // object -> key -> product2 techId, value - list of pbes
    
    constructor(pricebook:any) {
        super();
        this.record = pricebook;
        this.stdPricebookEntries = new Map<string, any>();
        this.pricebookEntries = new Map<string, any>();
        if (pricebook !== null) this.isStandard = pricebook['IsStandard'];
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

    public getStandardPricebookEntriesToInsert(product2Ids:Array<any>, pricebook2Ids:Array<any>) {
        let result = [];
        if (this.stdPricebookEntries) {
            const productKeys = Object.keys(this.stdPricebookEntries);
            productKeys.forEach(key => {
                const product = product2Ids.find(elem => elem['enxCPQ__TECH_External_Id__c'] == key);
                if (product !== undefined) {
                    const productId = product.Id;
                    const pricebook2Id = pricebook2Ids.find(elem => elem['IsStandard'] == true).Id;

                    let pbes:Array<any> = this.stdPricebookEntries[key];
                    pbes.forEach((pbe) => {
                        pbe.Product2Id = productId;
                        pbe.Pricebook2Id = pricebook2Id;
                        delete pbe['Product2'];
                        delete pbe['Pricebook2'];
                        result.push(pbe);
                    })
                }
            });
        }
        return result;
    }

    public getPricebookEntriesToInsert(product2Ids:Array<any>, pricebook2Ids:Array<any>) {
        let result = [];
        if (this.pricebookEntries) {
            const productKeys = Object.keys(this.pricebookEntries);
            productKeys.forEach(key => {
                const product = product2Ids.find(elem => elem['enxCPQ__TECH_External_Id__c'] === key);
                if (product !== undefined) {
                    const productId = product.Id;
                    const pricebook2Id = pricebook2Ids.find(elem => elem['enxCPQ__TECH_External_Id__c'] === this.getPricebookId()).Id;
                    let pbes:Array<any> = this.pricebookEntries[key];
                    pbes.forEach((pbe) => {
                        pbe.Product2Id = productId;
                        pbe.Pricebook2Id = pricebook2Id;
                        delete pbe['Product2'];
                        delete pbe['Pricebook2'];
                        result.push(pbe);
                    })
                }
            });
        }
        return result;
    }

}