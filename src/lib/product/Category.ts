export class Category {

    public record:any;
    
    constructor(category:any) {
        this.record = category;
    }
    
    public fillFromJSON(categoryJSON:string) {
        const jsonObj = JSON.parse(categoryJSON);
        for (let propName in jsonObj) {
            this[propName] = jsonObj[propName]
        }
    }

    public getFileName() {
        return this.record['Name'] +'_' + this.record['enxCPQ__TECH_External_Id__c']+ '.json'
    }

}