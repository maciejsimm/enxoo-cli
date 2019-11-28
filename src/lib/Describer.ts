import { Queries } from './query';
import { Util } from './Util';
import {core} from '@salesforce/command';

export class Describer {

    private dir: string;
    private isB2B: boolean;

    constructor(isB2B: boolean, dir: string){
        this.dir = dir;
        this.isB2B = isB2B;
    }
    public async all(conn: core.Connection){

        Util.setDir(this.dir)
        Util.createDir('./' + this.dir);
        let queryFields:any = {};
        queryFields.productFieldNames = await this.describeProduct(conn);
        queryFields.bundleElementFieldNames = await this.describeSObject(conn, 'enxCPQ__BundleElement__c');
        queryFields.bundleElementOptionFieldNames = await this.describeSObject(conn, 'enxCPQ__BundleElementOption__c');
        queryFields.pricebookFieldNames = await this.describePricebook(conn);
        queryFields.pbeFieldNames = await this.describePricebookEntry(conn);
        queryFields.productAttrFieldNames = await this.describeProductAttr(conn);
        queryFields.attrSetAttrFieldNames = await this.describeAttrSetAttr(conn);
        queryFields.attrFieldNames = await this.describeAttr(conn);
        queryFields.attrValuesFieldNames = await this.describeAttrValues(conn);
        queryFields.attrDefaultValuesFieldNames = await this.describeAttrDefaultValues(conn);
        queryFields.productRelationshipsFieldNames = await this.describeProductRelationships(conn);
        queryFields.attrValueDependecyFieldNames = await this.describeAttrValueDependecy(conn);
        queryFields.attrRulesFieldNames = await this.describeAttrRules(conn);
        queryFields.categoryFieldNames = await this.describeCategory(conn);
        queryFields.attrSetFieldNames = await this.describeAttrSet(conn);
        if(this.isB2B){
            queryFields.prvPlanAssignmentFieldNames = await this.describePrvPlanAssignment(conn);
            queryFields.prvTaskFieldNames = await this.describePrvTask(conn);
            queryFields.prvPlanFieldNames = await this.describePrvPlan(conn);
            queryFields.prvTaskAssignmentFieldNames = await this.describePrvTaskAssignment(conn);
        }

        Util.writeFile('/queryConfiguration.json', queryFields);
    }

    public retrieveFieldNames(metaData: String[]){
        let fieldNames = new Array<String>();
        metaData.filter(record => record['relationshipName'] === null && record['updateable'])
                 .forEach(record => {fieldNames.push(' ' + record['name'])});
    
        if(!this.isB2B){
            fieldNames = this.removeB2BFields(fieldNames);
        }

        return fieldNames.toString();
    }

    public removeB2BFields(fieldNames: String[]){
        let cpqFieldNames = fieldNames.filter(fieldName => !fieldName.includes('enxB2B'));
        return cpqFieldNames;
    }

    public async describeProduct(conn: core.Connection){
        let productFields = await Queries.describeAllFields(conn, 'Product2');
        let productFieldNames = this.retrieveFieldNames(productFields);

        return productFieldNames;
    }

    public async describePricebook(conn: core.Connection){
        let pricebookFields = await Queries.describeAllFields(conn, 'Pricebook2');
        let pricebookFieldNames = this.retrieveFieldNames(pricebookFields);

        return pricebookFieldNames;
    }

    public async describePricebookEntry(conn: core.Connection){
        let pbeFields = await Queries.describeAllFields(conn, 'PricebookEntry');
        let pbeFieldNames = this.retrieveFieldNames(pbeFields);

        return pbeFieldNames;
    }

    public async describeProductAttr(conn: core.Connection){
        let productAttrFields = await Queries.describeAllFields(conn, 'enxCPQ__ProductAttribute__c');
        let productAttrFieldNames = this.retrieveFieldNames(productAttrFields);

        return productAttrFieldNames;
    }

    public async describeAttrSetAttr(conn: core.Connection){
        let attrSetAttrFields = await Queries.describeAllFields(conn, 'enxCPQ__AttributeSetAttribute__c');
        let attrSetAttrFieldNames = this.retrieveFieldNames(attrSetAttrFields);

        return attrSetAttrFieldNames;
    }

    public async describeAttr(conn: core.Connection){
        let attrFields = await Queries.describeAllFields(conn, 'enxCPQ__Attribute__c');
        let attrFieldNames = this.retrieveFieldNames(attrFields);

        return attrFieldNames;
    }

    public async describePrvTask(conn: core.Connection){
        let prvTaskFields = await Queries.describeAllFields(conn, 'enxB2B__ProvisioningTask__c');
        let prvTaskFieldNames = this.retrieveFieldNames(prvTaskFields);

        return prvTaskFieldNames;
    }

    public async describePrvPlan(conn: core.Connection){
        let prvPlanFields = await Queries.describeAllFields(conn, 'enxB2B__ProvisioningPlan__c');
        let prvPlanFieldNames = this.retrieveFieldNames(prvPlanFields);

        return prvPlanFieldNames;
    }

    public async describeAttrValues(conn: core.Connection){
        let atrValuesFields = await Queries.describeAllFields(conn, 'enxCPQ__AttributeValue__c');
        let atrValuesFieldNames = this.retrieveFieldNames(atrValuesFields);

        return atrValuesFieldNames;
    }

    public async describeAttrDefaultValues(conn: core.Connection){
        let attrDefaultValuesFields = await Queries.describeAllFields(conn, 'enxCPQ__AttributeDefaultValue__c');
        let attrDefaultValuesFieldNames = this.retrieveFieldNames(attrDefaultValuesFields);

        return attrDefaultValuesFieldNames;
    }

    public async describeProductRelationships(conn: core.Connection){
        let productRelationshipsFields = await Queries.describeAllFields(conn, 'enxCPQ__ProductRelationship__c');
        let productRelationshipsFieldNames = this.retrieveFieldNames(productRelationshipsFields);

        return productRelationshipsFieldNames;
    }

    public async describeAttrValueDependecy(conn: core.Connection){
        let attrValueDependecyFields = await Queries.describeAllFields(conn, 'enxCPQ__AttributeValueDependency__c');
        let attrValueDependecyFieldNames = this.retrieveFieldNames(attrValueDependecyFields);

        return attrValueDependecyFieldNames;
    }

    public async describeAttrRules(conn: core.Connection){
        let attrRulesFields = await Queries.describeAllFields(conn, 'enxCPQ__AttributeRule__c');
        let attrRulesFieldNames = this.retrieveFieldNames(attrRulesFields);

        return attrRulesFieldNames;
    }

    public async describePrvPlanAssignment(conn: core.Connection){
        let prvPlanAssignmentFields = await Queries.describeAllFields(conn, 'enxB2B__ProvisioningPlanAssignment__c');
        let prvPlanAssignmentFieldNames = this.retrieveFieldNames(prvPlanAssignmentFields);

        return prvPlanAssignmentFieldNames;
    }

    public async describeCategory(conn: core.Connection){
        let categoryFields = await Queries.describeAllFields(conn, 'enxCPQ__Category__c');
        let categoryFieldNames = this.retrieveFieldNames(categoryFields);

        return categoryFieldNames;
    }

    public async describeAttrSet(conn: core.Connection){
        let attrSetFields = await Queries.describeAllFields(conn, 'enxCPQ__AttributeSet__c');
        let attrSetFieldNames = this.retrieveFieldNames(attrSetFields);

        return attrSetFieldNames;
    }

    public async describePrvTaskAssignment(conn: core.Connection){
        let prvTaskAssignmentFields = await Queries.describeAllFields(conn, 'enxB2B__ProvisioningTaskAssignment__c');
        let prvTaskAssignmentFieldNames = this.retrieveFieldNames(prvTaskAssignmentFields);

        return prvTaskAssignmentFieldNames;
    }

    public async describeSObject(connection: core.Connection, sObjectApiName){
        const fields = await Queries.describeAllFields(connection, sObjectApiName);
        return this.retrieveFieldNames(fields);
    }
}