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
    private currencyIsoCodes:Set<String>;
    private isB2B: boolean;

    constructor(products: Array<String>, isB2B: boolean) {
        this.categoryIds = new Set<String>();
        this.attributeIds = new Set<String>();
        this.attributeSetIds = new Set<String>();
        this.provisioningPlanIds = new Set<String>();
        this.currencyIsoCodes = new Set<String>();
        this.isB2B= isB2B;
        if (products[0] === '*ALL') {
            this.productList = ['GEPL', 'IPLC', 'VPN']; // to-do -> query all products in the org and build the list
        } else {
            this.productList = products;
        }
    }

    public async all(conn: core.Connection) {         
        Util.createAllDirs(this.isB2B);
        Queries.setIsB2B(this.isB2B);
        await this.retrievePriceBooks(conn, this.productList);

        for (let prodname of this.productList) {
            await this.retrieveProduct(conn, prodname);
            await this.retrieveCharges(conn, prodname);
        }
        if(this.isB2B){
        await this.retrieveProvisioningPlans(conn);
        await this.retrieveProvisioningTasks(conn);
        }
        await this.retrieveCategories(conn);
        await this.retrieveAttributes(conn);
        await this.retrieveAttributeSets(conn);
    } 

    private async retrieveProduct(conn: core.Connection, productName: String) {
        let product:any = {};
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
        
        if(this.isB2B){
        let provisioningPlanAssings = await Queries.queryProvisioningPlanAssigns(conn, productName);
        product.provisioningPlanAssings = provisioningPlanAssings;
        }
        
        product.root = productDefinition[0];
        product.options = options;
        product.chargesIds = chargesIds;
        product.productAttributes = productAttributes;
        product.attributeValues = attributeValues;
        product.attributeDefaultValues = attributeDefaultValues;
        product.attributeValueDependencies = attributeValueDependencies;
        product.attributeRules = attributeRules;
        product.productRelationships = productRelationships;
        this.extractIds(product);
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
    private async retrieveCategoriesHelper(conn: core.Connection, categories:any){
        let parentCategoriesIds =  new Set<String>();

        for (let category of categories) {

            if(category['enxCPQ__Parent_Category__r'] !==null){
                parentCategoriesIds.add(category['enxCPQ__Parent_Category__r']['enxCPQ__TECH_External_Id__c']);
            }

            Util.writeFile('./temp/categories/' + category['Name'] +'_' +category['enxCPQ__TECH_External_Id__c']+ '.json', category);
        }
        let newParentCategories = await Queries.queryCategories(conn, parentCategoriesIds);
        
        if(newParentCategories){
            this.retrieveCategoriesHelper(conn, newParentCategories);
        }
    }

    private async retrieveCategories(conn: core.Connection) {
        let categories = await Queries.queryCategories(conn, this.categoryIds);
        
        if(categories){
            this.retrieveCategoriesHelper(conn, categories);
        }
    }

    private async retrieveAttributes(conn: core.Connection) {
        let attributes = await Queries.queryAttributes(conn, this.attributeIds);
        let attributeValues = await Queries.queryAttributeValues(conn, this.attributeIds);
        
        if(attributes){
            attributes.forEach(attribute => {
        
            let attributeToSave:any = {};
            attributeToSave.root = attribute;
            attributeToSave.values = new Array<any>();

            attributeValues.filter(attributeValue => attributeValue['enxCPQ__Attribute__r']['enxCPQ__TECH_External_Id__c'] === attribute['enxCPQ__TECH_External_Id__c'])
                           .forEach(attributeValue=>{attributeToSave.values.push(attributeValue)});     

            Util.writeFile('./temp/attributes/' + attribute['Name'] + '_' + attribute['enxCPQ__TECH_External_Id__c']+ '.json', attributeToSave);
        })};
    }

    private async retrieveAttributeSets(conn: core.Connection) {
        let attributeSets = await Queries.queryAttributeSets(conn, this.attributeSetIds);
        let attributeSetAttributes = await Queries.queryAttributeSetAttributes(conn, this.attributeSetIds);
        if (attributeSets){
        attributeSets.forEach(attributeSet => {
        
            let attributeSetToSave:any = {};
            attributeSetToSave.root = attributeSet;
            attributeSetToSave.values = new Array<any>();

            attributeSetAttributes.filter(attributeSetAttribute => attributeSetAttribute['enxCPQ__Attribute_Set__r']['enxCPQ__TECH_External_Id__c'] === attributeSet['enxCPQ__TECH_External_Id__c'])
                                  .forEach(attributeSetAttribute => {attributeSetToSave.values.push(attributeSetAttribute)});     

            Util.writeFile('./temp/attributeSets/' + attributeSet['Name'] +'_' + attributeSet['enxCPQ__TECH_External_Id__c']+ '.json', attributeSetToSave);
        });}
    }

    private async retrieveProvisioningPlans(conn: core.Connection) {
        let provisioningPlans = await Queries.queryProvisioningPlans(conn);
        let prvTaskAssignments = await Queries.queryProvisioningTaskAssignments(conn)

        provisioningPlans.forEach(provisioningPlan=>{
        
            let provisioningPlanToSave:any = {};
            provisioningPlanToSave.root = provisioningPlan;
            provisioningPlanToSave.values = new Array<any>();

            prvTaskAssignments.filter(prvTaskAssignment => prvTaskAssignment['enxB2B__Provisioning_Plan__r']['enxB2B__TECH_External_Id__c'] === provisioningPlan['enxB2B__TECH_External_Id__c'])
                              .forEach(prvTaskAssignment => {provisioningPlanToSave.values.push(prvTaskAssignment)});     

            Util.writeFile('./temp/provisioningPlans/' + provisioningPlan['Name'] +'_' + provisioningPlan['enxB2B__TECH_External_Id__c']+ '.json', provisioningPlanToSave);
        });
    }
    
    private async retrieveProvisioningTasks(conn: core.Connection){
        let provisioningTasks = await Queries.queryProvisioningTasks(conn);

        provisioningTasks.forEach(provisioningTask => {
            Util.writeFile('./temp/provisioningTasks/' + provisioningTask['Name'] +'_' + provisioningTask['enxB2B__TECH_External_Id__c']+ '.json', provisioningTask);
        });
    }

    private async retrievePriceBooks(conn: core.Connection, productList: Array<String>){
        let joinedProductList = "'" + productList.join("','") + "'";
        let priceBooks = await Queries.queryPricebooks(conn);
        let currencies = await Queries.queryPricebookEntryCurrencies(conn, joinedProductList);
        let priceBookEntries = await Queries.queryPricebookEntries(conn, joinedProductList);
        let stdPriceBookEntries = await Queries.queryStdPricebookEntries(conn, joinedProductList);
        let chargeElementPricebookEntries = await Queries.queryChargeElementPricebookEntries(conn, joinedProductList);
        let chargeElementStdPricebookEntries = await Queries.queryChargeElementStdPricebookEntries(conn, joinedProductList);
        
        if(priceBooks){
        priceBooks.forEach(priceBook => {

            const priceBookTechExtId = priceBook['enxCPQ__TECH_External_Id__c'];
            Util.createDir('./temp/priceBooks/' + priceBook['Name']);
            Util.writeFile('./temp/PriceBooks/' + priceBook['Name'] + '.json', priceBook)
            
            currencies.forEach(currency =>{this.currencyIsoCodes.add(currency['CurrencyIsoCode'])});
            
            this.currencyIsoCodes.forEach(currency=>{

                let currencyToSave:any = {};
                currencyToSave.entries = new Array<any>();
                currencyToSave.stdEntries = new Array<any>();
                currencyToSave.chargeElementPricebookEntries = new Array<any>();
                currencyToSave.chargeElementStdPricebookEntries = new Array<any>();
                
                priceBookEntries.filter(pbe => pbe['Pricebook2'] && pbe['Pricebook2']['enxCPQ__TECH_External_Id__c'] === priceBookTechExtId 
                                && currency === pbe['CurrencyIsoCode'])
                                .forEach(pbe=>{currencyToSave.entries.push(pbe)});

                stdPriceBookEntries.filter(stdPbe => stdPbe['Pricebook2'] && stdPbe['Pricebook2']['enxCPQ__TECH_External_Id__c'] === priceBookTechExtId
                                   && currency === stdPbe['CurrencyIsoCode'])
                                   .forEach(stdPbe=>{ currencyToSave.stdEntries.push(stdPbe)});
                                
                chargeElementPricebookEntries.filter(chargeElementPbe => chargeElementPbe['Pricebook2'] && chargeElementPbe['Pricebook2']['enxCPQ__TECH_External_Id__c'] === priceBookTechExtId
                                              && currency === chargeElementPbe['CurrencyIsoCode'])
                                             .forEach(chargeElementPbe=>{ currencyToSave.chargeElementPricebookEntries.push(chargeElementPbe)});

                chargeElementStdPricebookEntries.filter(chargeElementStdPbe => chargeElementStdPbe['Pricebook2'] && chargeElementStdPbe['Pricebook2']['enxCPQ__TECH_External_Id__c'] === priceBookTechExtId
                                                && currency === chargeElementStdPbe['CurrencyIsoCode'])
                                                .forEach(chargeElementStdPbe=>{currencyToSave.chargeElementStdPricebookEntries.push(chargeElementStdPbe)});

                Util.writeFile('./temp/PriceBooks/' + priceBook['Name'] + '/' + currency + '.json', currencyToSave);
            });
        });}
    }

    private async retrieveCharges(conn: core.Connection, productName: String){
        let charges = await Queries.queryProductCharges(conn, productName);

        for(let charge of charges){

            let chargeName = charge['Name'];
            let chargeReference = charge['enxCPQ__Charge_Reference__c'];
            let chargeElements = await Queries.queryChargeElements(conn, productName, chargeReference);
            let chargeTiers = await Queries.queryChargeTiers(conn, productName, chargeReference);
            let chargeToSave: any = {};
            let chargeElementsToSave: any = [];
            let chargeTiersToSave: any = [];
            chargeToSave.root= charge;
            
            chargeElements.filter(chargeElement => chargeElement['enxCPQ__Charge_Parent__r']['enxCPQ__TECH_External_Id__c'] === charge['enxCPQ__TECH_External_Id__c'])
                          .forEach(chargeElementToSave=>{ chargeElementsToSave.push(chargeElementToSave)});
      
             chargeTiers.filter(chargeTier => chargeTier['enxCPQ__Charge_Parent__r']['enxCPQ__TECH_External_Id__c'] === charge['enxCPQ__TECH_External_Id__c'])
                        .forEach(chargeTierToSave=>{ chargeTiersToSave.push(chargeTierToSave)});              

            chargeToSave.chargeElements = chargeElementsToSave;
            chargeToSave.chargeTier = chargeTiersToSave;
            Util.writeFile('./temp/charges/' +chargeName + '.json', chargeToSave);
        }
    }
}