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
import {core} from '@salesforce/command';
import { Queries } from './query';

export class ProductExporter {
    private categoryIds:Set<String>;
    private attributeIds:Set<String>;
    private attributeSetIds:Set<String>;
    private provisioningPlanIds:Set<String>;
    private productList:Array<String>;
    private parentCategoriesIds:Set<String>;
    private currencyIsoCodes:Set<String>;

    constructor(products: Array<String>) {
        this.categoryIds = new Set<String>();
        this.attributeIds = new Set<String>();
        this.attributeSetIds = new Set<String>();
        this.provisioningPlanIds = new Set<String>();
        this.parentCategoriesIds = new Set<String>();
        this.currencyIsoCodes = new Set<String>();
     
        if (products[0] === '*ALL') {
            this.productList = ['GEPL', 'IPLC', 'VPN']; // to-do -> query all products in the org and build the list
        } else {
            this.productList = products;
        }
    }


    public async all(conn: core.Connection) {            

        for (let prodname of this.productList) {
            await this.retrieveProduct(conn, prodname);
            await this.retrievePriceBooks(conn, prodname);
            await this.retrieveCharges(conn, prodname);
            await this.retrieveProductIds(conn, prodname);
        }
        await this.retrieveProvisioningPlans(conn);
        await this.retrieveProvisioningTasks(conn);
        await this.retrieveCategories(conn);
        await this.retrieveAttributes(conn);
        await this.retrieveAttributeSets(conn);
    } 

    private async retrieveProduct(conn: core.Connection, productName: String) {
        Util.showSpinner(productName + ' export');

        let productDefinition = await Queries.queryProduct(conn, productName);
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
        Util.createDir('./temp/products', true);
        Util.writeFile('./temp/products/' + productName + '_' + product.root['enxCPQ__TECH_External_Id__c'] + '.json', product);

        Util.hideSpinner(productName + ' export done'); 
    }


    private extractIds(product:any) {

        // Category IDs
        if(product.root.enxCPQ__Category__r){this.categoryIds.add(product.root.enxCPQ__Category__r.enxCPQ__TECH_External_Id__c);}
        // Attribute & Attribute Set IDs
        if (product.productAttributes != null) {
            product.productAttributes.forEach( attr => {
                this.attributeIds.add(attr.enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c);
                if (attr['enxCPQ__Attribute_Set__r'] != undefined) {
                    this.attributeSetIds.add(attr.enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c);
                }
            });
        }

        // Provisioning Plan IDs
        if (product.provisioningPlanAssings != null) {
            for (let assign of product.provisioningPlanAssings) {
                this.provisioningPlanIds.add(assign.enxB2B__Provisioning_Plan__r.enxB2B__TECH_External_Id__c);
            }
        }
    }

    private async retrieveCategories(conn: core.Connection) {
        let categories = await Queries.queryCategories(conn, this.categoryIds);
        Util.createDir('./temp/categories', false);
        
        if(categories){
        for (let category of categories) {
            if(category['enxCPQ__Parent_Category__r'] !==null){
                this.parentCategoriesIds.add(category['enxCPQ__Parent_Category__r']['enxCPQ__TECH_External_Id__c']);
            }
            Util.writeFile('./temp/categories/' + category['Name'] +'_' +category['enxCPQ__TECH_External_Id__c']+ '.json', category);
        }}
        let parentCategories = await Queries.queryCategories(conn, this.parentCategoriesIds);
        if(parentCategories){
        for (let parentCategory of parentCategories) {
            Util.writeFile('./temp/categories/' + parentCategory['Name'] +'_' +parentCategory['enxCPQ__TECH_External_Id__c']+ '.json', parentCategory);
        }}
    }

    private async retrieveAttributes(conn: core.Connection) {
        let attributes = await Queries.queryAttributes(conn, this.attributeIds);
        let attributeValues = await Queries.queryAttributeValues(conn, this.attributeIds);
        Util.createDir('./temp/attributes', false);
        if(attributes){
        for (let attribute of attributes) {
            let attributeToSave:any = {};
            attributeToSave.root = attribute;
            attributeToSave.values = new Array<any>();

            for (let attributeValue of attributeValues) {
                if (attributeValue['enxCPQ__Attribute__r']['enxCPQ__TECH_External_Id__c'] === attribute['enxCPQ__TECH_External_Id__c']) {
                    attributeToSave.values.push(attributeValue);
                }
            }
            Util.writeFile('./temp/attributes/' + attribute['Name'] + '_' + attribute['enxCPQ__TECH_External_Id__c']+ '.json', attributeToSave);
        }}
    }

    private async retrieveAttributeSets(conn: core.Connection) {
        let attributeSets = await Queries.queryAttributeSets(conn, this.attributeSetIds);
        let attributeSetAttributes = await Queries.queryAttributeSetAttributes(conn, this.attributeSetIds);
        Util.createDir('./temp/attributeSets', false);

        for (let attributeSet of attributeSets) {
            let attributeSetToSave:any = {};
            attributeSetToSave.root = attributeSet;
            attributeSetToSave.values = new Array<any>();

            for (let attributeSetAttribute of attributeSetAttributes) {
                if (attributeSetAttribute['enxCPQ__Attribute_Set__r']['enxCPQ__TECH_External_Id__c'] === attributeSet['enxCPQ__TECH_External_Id__c']) {
                    attributeSetToSave.values.push(attributeSetAttribute);
                }
            }
            Util.writeFile('./temp/attributeSets/' + attributeSet['Name'] +'_' + attributeSet['enxCPQ__TECH_External_Id__c']+ '.json', attributeSetToSave);
        }
    }

    private async retrieveProvisioningPlans(conn: core.Connection) {
        let provisioningPlans = await Queries.queryProvisioningPlans(conn);
        let provisioningTaskAssignments = await Queries.queryProvisioningTaskAssignments(conn)
        Util.createDir('./temp/provisioningPlans', false);

        for (let provisioningPlan of provisioningPlans) {
            let provisioningPlanToSave:any = {};
            provisioningPlanToSave.root = provisioningPlan;
            provisioningPlanToSave.values = new Array<any>();

            for (let provisioningTaskAssignment of provisioningTaskAssignments) {
                if (provisioningTaskAssignment['enxB2B__Provisioning_Plan__r']['enxB2B__TECH_External_Id__c'] === provisioningPlan['enxB2B__TECH_External_Id__c']) {
                    provisioningPlanToSave.values.push(provisioningTaskAssignment);
                }
            }
            Util.writeFile('./temp/provisioningPlans/' + provisioningPlan['Name'] +'_' + provisioningPlan['enxB2B__TECH_External_Id__c']+ '.json', provisioningPlanToSave);
        }
    }
    
    private async retrieveProductIds(conn: core.Connection, prodName: String){
        let productIds = await Queries.queryProductIds(conn, prodName);
        Util.createDir('./temp/productIds', false);
      
        Util.writeFile('./temp/productIds/' + prodName +'_' + productIds[0]['enxCPQ__TECH_External_Id__c']+ '.json', productIds);
        
    }
    private async retrieveProvisioningTasks(conn: core.Connection){
        let provisioningTasks = await Queries.queryProvisioningTasks(conn);
        Util.createDir('./temp/provisioningTasks', false);
        for (let provisioningTask of provisioningTasks) {
        Util.writeFile('./temp/provisioningTasks/' + provisioningTask['Name'] +'_' + provisioningTask['enxB2B__TECH_External_Id__c']+ '.json', provisioningTask);
        }
    }

    private async retrievePriceBooks(conn: core.Connection, productName: String){
        let priceBooks = await Queries.queryPricebooks(conn);
        let currencies = await Queries.queryPricebookEntryCurrencies(conn, productName);
        let priceBookEntries = await Queries.queryPricebookEntries(conn, productName);
        let stdPriceBookEntries = await Queries.queryStdPricebookEntries(conn, productName);
        let chargeElementPricebookEntries = await Queries.bulkQueryChargeElementPricebookEntries(conn, productName);
        let chargeElementStdPricebookEntries = await Queries.bulkQueryChargeElementStdPricebookEntries(conn, productName);

        Util.createDir('./temp/priceBooks', true);
        for (let priceBook of priceBooks) {
            const priceBookTechExtId = priceBook['enxCPQ__TECH_External_Id__c'];
            Util.createDir('./temp/priceBooks/' + priceBook['Name'], true);
            
            Util.writeFile('./temp/PriceBooks/' + priceBook['Name'] + '.json', priceBook)
            
            for(let currency of currencies){
                this.currencyIsoCodes.add(currency['CurrencyIsoCode']);
            }
           
            for(let currency of this.currencyIsoCodes.values()){
                let currencyToSave:any = {};
                currencyToSave.entries = new Array<any>();
                currencyToSave.stdEntries = new Array<any>();
                currencyToSave.chargeElementPricebookEntries = new Array<any>();
                currencyToSave.chargeElementStdPricebookEntries = new Array<any>();
                
            
            
            for (let pbe of priceBookEntries) {
                if (pbe['Pricebook2'] && pbe['Pricebook2']['enxCPQ__TECH_External_Id__c'] === priceBookTechExtId 
                    && currency === pbe['CurrencyIsoCode']) {
                    currencyToSave.entries.push(pbe);
                }
            }
            for (let stdPbe of stdPriceBookEntries) {
                if (stdPbe['Pricebook2'] && stdPbe['Pricebook2']['enxCPQ__TECH_External_Id__c'] === priceBookTechExtId
                    && currency === stdPbe['CurrencyIsoCode']) {
                    currencyToSave.stdEntries.push(stdPbe);
                }
            }
            
            for (let chargeElementPbe of chargeElementPricebookEntries) {
                if (chargeElementPbe['Pricebook2'] && chargeElementPbe['Pricebook2']['enxCPQ__TECH_External_Id__c'] === priceBookTechExtId
                    && currency === chargeElementPbe['CurrencyIsoCode']) {
                    currencyToSave.stdEntries.push(chargeElementPbe);
                }
            }
            
            for (let chargeElementStdPbe of chargeElementStdPricebookEntries) {
                if (chargeElementStdPbe['Pricebook2'] && chargeElementStdPbe['Pricebook2']['enxCPQ__TECH_External_Id__c'] === priceBookTechExtId
                    && currency === chargeElementStdPbe['CurrencyIsoCode']) {
                    currencyToSave.stdEntries.push(chargeElementStdPbe);
                }
            }
            Util.writeFile('./temp/PriceBooks/' + priceBook['Name'] + '/' + currency + '.json', currencyToSave);
        }
        }
    }


    private async retrieveCharges(conn: core.Connection, productName: String){
        let charges = await Queries.queryProductCharges(conn, productName);
        Util.createDir('./temp/charges', false);
   
        for(let charge of charges){
        let chargeName = charge['Name'];
        let chargeReference = charge['enxCPQ__Charge_Reference__c'];
        let chargeElements = await Queries.bulkQueryChargeElements(conn, productName, chargeReference);
        let chargeTier = await Queries.bulkQueryChargeTiers(conn, productName, chargeReference);
        let chargeToSave: any = {};
        chargeToSave.root= charge;
        chargeToSave.chargeElements = chargeElements;
        chargeToSave.chargeTier = chargeTier;
        Util.writeFile('./temp/charges/' +chargeName + '.json', chargeToSave);
        }
    }
}