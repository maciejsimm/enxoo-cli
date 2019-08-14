// Class responsible for Extracting product data from an org

// ----- categories
// ----- products
// ----- productAttributes
// ----- attributeSets
// ----- attributeSetAttributes
// ----- attributes
// ----- attributeValues
// ----- attributeValueDependencies
// ----- attributeDefaultValues
// ----- attributeRules
// ----- productRelationships
// ----- provisioningPlanAssignments
// ----- provisioningPlans

// charges
// pricebooks
// stdPricebookEntries
// pricebookEntries
// provisioningTasks
// provisioningTaskAssignments
// priceRules
// priceRuleConditions
// priceRuleActions


import { Util } from './Util';
import { Connection } from '@salesforce/core';
import * as fs from 'fs';
import { Queries } from './query';

export class ProductExporter {

    constructor(products: Array<String>) {
        if (products[0] === '*ALL') {
            this.productList = ['GEPL', 'IPLC', 'VPN']; // to-do -> query all products in the org and build the list
        } else {
            this.productList = products;
        }
    }

    private categoryIds:Set<String>;
    private attributeIds:Set<String>;
    private attributeSetIds:Set<String>;
    private provisioningPlanIds:Set<String>;
    private productList:Array<String>;
    private parentCategoriesIds:Set<String>;

    public async all(conn: Connection) {            
        this.categoryIds = new Set<String>();
        this.attributeIds = new Set<String>();
        this.attributeSetIds = new Set<String>();
        this.provisioningPlanIds = new Set<String>();
        this.parentCategoriesIds = new Set<String>();
        // let pricebookIds = [];
        // let priceRuleIds = [];

        for (let prodname of this.productList) {
            await this.retrieveProduct(conn, prodname);
            await this.retrieveChargeElementPricebookEntryIds(conn, prodname);
            await this.retrieveProductAttributeIds(conn, prodname);
            await this.retrieveProductIds(conn, prodname);
            await this.retrievePriceBooks(conn, prodname);
            await this.retrieveProductIdsBulk(conn, prodname);
            await this.retrieveCharges(conn, prodname);
        }
        await this.retrieveRecordTypes(conn);
        await this.retrieveProvisioningPlans(conn);
        await this.retrieveProvisioningTasks(conn);
        await this.retrievePricebooksIds(conn);
        await this.retrieveProvisioningTaskAssignmentIds(conn);
        await this.retrieveProvisioningPlanAssignmentIds(conn);
        await this.retrieveCategories(conn);
        await this.retrieveAttributes(conn);
        await this.retrieveAttributeSets(conn);
        await this.retrieveStdPricebookEntryIds(conn);
    } 

    private async retrieveProduct(conn: Connection, productName: String) {
        Util.showSpinner(productName + ' export');

        let productDefinition = await Queries.queryProduct(conn, productName);
        console.log(productDefinition);
        let options = await Queries.queryProductOptions(conn, productName);
        let chargesIds = await Queries.queryProductChargesIds(conn, productName);
        let productAttributes = await Queries.queryProductAttributes(conn, productName);
        let attributeValues = await Queries.queryProductAttributeValues(conn, productName);
        let attributeDefaultValues = await Queries.queryAttributeDefaultValues(conn, productName);
        let attributeValueDependencies = await Queries.queryAttributeValueDependencies(conn, productName);
        let attributeRules = await Queries.queryAttributeRules(conn, productName);
        let productRelationships = await Queries.queryProductRelationships(conn, productName);
        let provisioningPlanAssings = await Queries.queryProvisioningPlanAssigns(conn, productName);

        let product:any = {};
        product.root = productDefinition[0];
        product.options = options;
        product.chargesIds = chargesIds;
        product.productAttributes = productAttributes;
        product.attributeValues = attributeValues;
        product.attributeDefaultValues = attributeDefaultValues;
        product.attributeValueDependencies = attributeValueDependencies;
        product.attributeRules = attributeRules;
        product.productRelationships = productRelationships;
        product.provisioningPlanAssings = provisioningPlanAssings;
        this.extractIds(product);
        var dir = './temp/products';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        await fs.writeFile("./temp/products/" + productName + '_' + product.root['enxCPQ__TECH_External_Id__c'] + ".json", JSON.stringify(Util.sanitizeJSON(product), null, 3), function(err) {
            if(err) {
                return console.log(err);
            }
        });

        Util.hideSpinner(productName + ' export done'); 
    }

    private extractIds(product:any) {

        // Category IDs
        this.categoryIds.add(product.root.enxCPQ__Category__r.enxCPQ__TECH_External_Id__c);

        // Attribute & Attribute Set IDs
        if (product.productAttributes != null) {
            for (let attr of product.productAttributes) {
                this.attributeIds.add(attr.enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c);
                if (attr['enxCPQ__Attribute_Set__r'] != undefined) {
                    this.attributeSetIds.add(attr.enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c);
                }
            }
        }

        // Provisioning Plan IDs
        if (product.provisioningPlanAssings != null) {
            for (let assign of product.provisioningPlanAssings) {
                this.provisioningPlanIds.add(assign.enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c);
            }
        }
    }

    private async retrieveCategories(conn: Connection) {
        let categories = await Queries.queryCategories(conn, this.categoryIds);
        

        for (let category of categories) {
            if(category['enxCPQ__Parent_Category__r'] !==null){
                this.parentCategoriesIds.add(category['enxCPQ__Parent_Category__r']['enxCPQ__TECH_External_Id__c']);
            }
        }
        let parentCategories = await Queries.queryCategories(conn, this.parentCategoriesIds);
        
        var dir1 = './temp/categories';
        if (!fs.existsSync(dir1)){
            fs.mkdirSync(dir1);
        }

        var dir2 = './temp/parentCategories';
        if (!fs.existsSync(dir2)){
            fs.mkdirSync(dir2);
        }

        for (let parentCategory of parentCategories) {
            await fs.writeFile("./temp/parentCategories/" + parentCategory['Name'] +'_' +parentCategory['enxCPQ__TECH_External_Id__c']+ ".json", JSON.stringify(Util.sanitizeJSON(parentCategory), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }


        for (let category of categories) {    
            await fs.writeFile("./temp/categories/" + category['Name'] +'_' +category['enxCPQ__TECH_External_Id__c']+ ".json", JSON.stringify(Util.sanitizeJSON(category), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    private async retrieveAttributes(conn: Connection) {
        let attributes = await Queries.queryAttributes(conn, this.attributeIds);
        let attributeValues = await Queries.queryAttributeValues(conn, this.attributeIds);

        var dir = './temp/attributes';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let attribute of attributes) {
            let attributeToSave:any = {};
            attributeToSave.root = attribute;
            attributeToSave.values = new Array<any>();

            for (let attributeValue of attributeValues) {
                if (attributeValue['enxCPQ__Attribute__r']['enxCPQ__TECH_External_Id__c'] === attribute['enxCPQ__TECH_External_Id__c']) {
                    attributeToSave.values.push(attributeValue);
                }
            }

            await fs.writeFile("./temp/attributes/" + attribute['Name'] + '_' + attribute['enxCPQ__TECH_External_Id__c']+ ".json", JSON.stringify(Util.sanitizeJSON(attributeToSave), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    private async retrieveAttributeSets(conn: Connection) {
        let attributeSets = await Queries.queryAttributeSets(conn, this.attributeSetIds);
        let attributeSetAttributes = await Queries.queryAttributeSetAttributes(conn, this.attributeSetIds);
        
        var dir = './temp/attributeSets';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let attributeSet of attributeSets) {
            let attributeSetToSave:any = {};
            attributeSetToSave.root = attributeSet;
            attributeSetToSave.values = new Array<any>();

            for (let attributeSetAttribute of attributeSetAttributes) {
                if (attributeSetAttribute['enxCPQ__Attribute_Set__r']['enxCPQ__TECH_External_Id__c'] === attributeSet['enxCPQ__TECH_External_Id__c']) {
                    attributeSetToSave.values.push(attributeSetAttribute);
                }
            }

            await fs.writeFile("./temp/attributeSets/" + attributeSet['Name'] +'_' + attributeSet['enxCPQ__TECH_External_Id__c']+ ".json", JSON.stringify(Util.sanitizeJSON(attributeSetToSave), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    private async retrieveProvisioningPlans(conn: Connection) {
        let provisioningPlans = await Queries.queryProvisioningPlans(conn);
        let provisioningTaskAssignments = await Queries.queryProvisioningTaskAssignments(conn)
        
        var dir = './temp/provisioningPlans';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let provisioningPlan of provisioningPlans) {
            let provisioningPlanToSave:any = {};
            provisioningPlanToSave.root = provisioningPlan;
            provisioningPlanToSave.values = new Array<any>();

            for (let provisioningTaskAssignment of provisioningTaskAssignments) {
                if (provisioningTaskAssignment['enxB2B__Provisioning_Plan__r']['enxB2B__TECH_External_Id__c'] === provisioningPlan['enxB2B__TECH_External_Id__c']) {
                    provisioningPlanToSave.values.push(provisioningTaskAssignment);
                }
            }

            await fs.writeFile("./temp/provisioningPlans/" + provisioningPlan['Name'] +'_' + provisioningPlan['enxB2B__TECH_External_Id__c']+ ".json", JSON.stringify(Util.sanitizeJSON(provisioningPlanToSave), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }
    
    private async retrieveProvisioningTasks(conn: Connection){
        let provisioningTasks = await Queries.queryProvisioningTasks(conn)
        let provisioningTaskAssignments = await Queries.queryProvisioningTaskAssignments(conn)
        var dir = './temp/provisioningTasks';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }


        for (let provisioningTask of provisioningTasks) {
            let provisioningTaskToSave:any = {};
            provisioningTaskToSave.root = provisioningTask;
            provisioningTaskToSave.values = new Array<any>();

            for (let provisioningTaskAssignment of provisioningTaskAssignments) {
                if (provisioningTaskAssignment['enxB2B__Provisioning_Task__r']['enxB2B__TECH_External_Id__c'] === provisioningTask['enxB2B__TECH_External_Id__c']) {
                    provisioningTaskToSave.values.push(provisioningTaskAssignment);
                }
            }

            await fs.writeFile("./temp/provisioningTasks/" + provisioningTask['Name'] +'_' + provisioningTask['enxB2B__TECH_External_Id__c']+ ".json", JSON.stringify(Util.sanitizeJSON(provisioningTaskToSave), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    private async retrievePriceBooks(conn: Connection, productName: String){
        let priceBooks = await Queries.queryPricebooks(conn);
        let priceBookEntries = await Queries.queryPricebookEntries(conn, productName);
        let stdPriceBookEntries = await Queries.queryStdPricebookEntries(conn, productName);
        let chargeElementPricebookEntries = await Queries.bulkQueryChargeElementPricebookEntries(conn, productName);
        let chargeElementStdPricebookEntries = await Queries.bulkQueryChargeElementStdPricebookEntries(conn, productName);

        var dir = './temp/priceBooks';
        console.log(fs.existsSync(dir));
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        for (let priceBook of priceBooks) {
            let priceBookToSave:any = {};
            priceBookToSave.root = priceBook;
            priceBookToSave.entries = new Array<any>();
            priceBookToSave.stdEntries = new Array<any>();
            priceBookToSave.chargeElementPricebookEntries = new Array<any>();
            priceBookToSave.chargeElementStdPricebookEntries = new Array<any>();

            for (let priceBookEntry of priceBookEntries) {
                if (priceBookEntry['Pricebook2Id']['enxB2B__TECH_External_Id__c'] === priceBook['enxB2B__TECH_External_Id__c']) {
                    priceBookToSave.entries.push(priceBookEntry);
                }
            }
            for (let stdPriceBookEntry of stdPriceBookEntries) {
                if (stdPriceBookEntry['Pricebook2Id']['enxB2B__TECH_External_Id__c'] === priceBook['enxB2B__TECH_External_Id__c']) {
                    priceBookToSave.stdEntries.push(stdPriceBookEntry);
                }
            }

            for (let chargeElementPricebookEntry of chargeElementPricebookEntries) {
                if (chargeElementPricebookEntry['Pricebook2Id']['enxB2B__TECH_External_Id__c'] === priceBook['enxB2B__TECH_External_Id__c']) {
                    priceBookToSave.stdEntries.push(chargeElementPricebookEntry);
                }
            }

            for (let chargeElementStdPricebookEntry of chargeElementStdPricebookEntries) {
                if (chargeElementStdPricebookEntry['Pricebook2Id']['enxB2B__TECH_External_Id__c'] === priceBook['enxB2B__TECH_External_Id__c']) {
                    priceBookToSave.stdEntries.push(chargeElementStdPricebookEntry);
                }
            }

            await fs.writeFile("./temp/PriceBooks/" + priceBook['Name'] + ".json", JSON.stringify(Util.sanitizeJSON(priceBookToSave), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }


    private async retrieveChargeElementPricebookEntryIds(conn: Connection, productName: String){
        let chargeElementPricebookEntryIds = await Queries.bulkQueryChargeElementPricebookEntryIds(conn, productName)
        var dir = './temp/ids/ChargeElementPricebookEntryIds';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        await fs.writeFile("./temp/ids/ChargeElementPricebookEntryIds/" +productName + ".json", JSON.stringify(chargeElementPricebookEntryIds), function(err) {
            if(err) {
                return console.log(err);
            }
            Util.log("----- charge elements file was saved");          
        });
    }

    private async retrieveRecordTypes(conn: Connection){
        let recordTypes = await Queries.queryRecordTypes(conn)
        var dir = './temp/recordTypes';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let recordType of recordTypes) {
            await fs.writeFile("./temp/recordTypes/" + recordType['Name'] +'_' + recordType['Id'] + ".json", JSON.stringify(Util.sanitizeJSON(recordType), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    private async retrieveProductIds(conn: Connection, productName: String){
        let productIds = await Queries.queryProductIds(conn, productName)
        var dir = './temp/ids/productIds';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

    
            await fs.writeFile("./temp/ids/productIds/" +productName + ".json", JSON.stringify(Util.sanitizeJSON(productIds), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        
    }

    private async retrieveProductAttributeIds(conn: Connection, productName: String){
        let productAttributeIds = await Queries.queryProductAttributeIds(conn, productName)
        var dir = './temp/ids/productAttributeIds';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

    
            await fs.writeFile("./temp/ids/productAttributeIds/" +productName + ".json", JSON.stringify(Util.sanitizeJSON(productAttributeIds), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        
    }
    private async retrievePricebooksIds(conn: Connection){
        let pricebooksIds = await Queries.queryPricebooksIds(conn)
        var dir = './temp/ids/pricebooksIds';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

            await fs.writeFile("./temp/ids/pricebooksIds/" + "pricebooksIds" + ".json", JSON.stringify(Util.sanitizeJSON(pricebooksIds), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        
    } 

  

    private async retrieveCharges(conn: Connection, productName: String){
        let root = await Queries.queryProductCharges(conn, productName);
        let chargeName = root['enxCPQ__Charge_Reference__c'];
        let chargeElements = await Queries.bulkQueryChargeElements(conn, productName, chargeName);
        let chargeTier = await Queries.bulkQueryChargeTiers(conn, productName, chargeName);

        let charge: any = {};
        charge.root= root;
        charge.chargeElements = chargeElements;
        charge.chargeTier = chargeTier;
        
        var dir = './temp/charges';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

    
            await fs.writeFile("./temp/charges/" +productName + ".json", JSON.stringify(Util.sanitizeJSON(charge), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        
    }




    private async retrieveProvisioningPlanAssignmentIds(conn: Connection){
        let provisioningPlanAssignmentIds = await Queries.queryProvisioningPlanAssignmentIds(conn)
        var dir = './temp/ids/provisioningPlanAssignmentIds';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

            await fs.writeFile("./temp/ids/provisioningPlanAssignmentIds/" + "provisioningPlanAssignmentIds" + ".json", JSON.stringify(Util.sanitizeJSON(provisioningPlanAssignmentIds), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
    }
    private async retrieveProvisioningTaskAssignmentIds(conn: Connection){
        let provisioningTaskAssignmentIds = await Queries.queryProvisioningTaskAssignmentIds(conn)
        var dir = './temp/ids/provisioningTaskAssignmentIds';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

            await fs.writeFile("./temp/ids/provisioningTaskAssignmentIds/" + "provisioningTaskAssignmentIds" + ".json", JSON.stringify(Util.sanitizeJSON(provisioningTaskAssignmentIds), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    

    private async retrieveProvisioningTaskAssignments(conn: Connection){
        let provisioningTaskAssignments = await Queries.queryProvisioningTaskAssignments(conn)
        var dir = './temp/provisioningTaskAssignments';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let provisioningTaskAssignment of provisioningTaskAssignments) {
            await fs.writeFile("./temp/provisioningTaskAssignments/" + provisioningTaskAssignment['Name'] +'_' + provisioningTaskAssignment['enxB2B__TECH_External_Id__c'] + ".json", JSON.stringify(Util.sanitizeJSON(provisioningTaskAssignment), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }
    private async retrievePriceRules(conn: Connection){
        let priceRules = await Queries.queryPriceRules(conn)
        var dir = './temp/priceRules';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let priceRule of priceRules) {
            await fs.writeFile("./temp/priceRules/" + priceRule['Name'] + ".json", JSON.stringify(Util.sanitizeJSON(priceRule), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    private async retrievePriceRuleConditions(conn: Connection){
        let PriceRuleConditions = await Queries.queryPriceRules(conn)
        var dir = './temp/PriceRuleConditions';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let PriceRuleCondition of PriceRuleConditions) {
            await fs.writeFile("./temp/PriceRuleConditions/" + PriceRuleCondition['Name'] + ".json", JSON.stringify(Util.sanitizeJSON(PriceRuleCondition), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    private async retrievePriceRuleActions(conn: Connection){
        let priceRuleActions = await Queries.queryPriceRules(conn)
        var dir = './temp/priceRuleActions';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let PriceRuleAction of priceRuleActions) {
            await fs.writeFile("./temp/priceRuleActions/" + PriceRuleAction['Name'] + ".json", JSON.stringify(Util.sanitizeJSON(PriceRuleAction), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }
    private async retrieveProductIdsBulk(conn: Connection, productName: String){
        let productIds = await Queries.bulkQueryProductIds(conn, productName)
        var dir = './temp/ids/chargeElementProductIds';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

    
            await fs.writeFile("./temp/ids/chargeElementProductIds/" +productName + ".json", JSON.stringify(Util.sanitizeJSON(productIds), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
    }

    private async retrieveStdPricebookEntryIds(conn: Connection){
        let stdPricebookEntryIds = await Queries.bulkQueryStdPricebookEntryIds(conn)
        var dir = './temp/ids/stdPricebookEntryIds';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        for (let stdPricebookEntryId of stdPricebookEntryIds) {
            await fs.writeFile("./temp/ids/stdPricebookEntryIds/" + stdPricebookEntryId['Id'] + ".json", JSON.stringify(Util.sanitizeJSON(stdPricebookEntryId), null, 3), function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

}