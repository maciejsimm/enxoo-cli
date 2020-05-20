import { Serializable } from "./Serializable";

export class ProvisioningPlan extends Serializable {

    public record:any;
    public provisioningTasks:Array<any>;
    
    constructor(attribute:any) {
        super();
        this.record = attribute;
        this.provisioningTasks = [];
    }

    public getFileName() {
        return this.record['Name'] +'_' + this.record['enxB2B__TECH_External_Id__c']+ '.json'
    }

    public getProvisioningTaskIds() {
        return this.provisioningTasks.map((task) => {
            return task['enxB2B__Provisioning_Task__r']['enxB2B__TECH_External_Id__c'];
        });
    }

}