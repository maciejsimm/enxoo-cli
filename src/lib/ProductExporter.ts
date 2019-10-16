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
import { Connection } from 'jsforce';
import { Queries } from './query';
import { debug } from 'util';

export class ProductExporter {
    private categoryIds:Set<String>;
    private attributeIds:Set<String>;
    private attributeSetIds:Set<String>;
    private provisioningPlanIds:Set<String>;
    private productList:Set<string>;
    private currencyIsoCodes:Set<String>;
    private isB2B: boolean;
    private dir: string;

    constructor(products: Set<string>, isB2B: boolean, dir: string) {
        this.categoryIds = new Set<String>();
        this.attributeIds = new Set<String>();
        this.attributeSetIds = new Set<String>();
        this.provisioningPlanIds = new Set<String>();
        this.currencyIsoCodes = new Set<String>();
        this.dir = dir;
        this.isB2B = isB2B;
        this.productList = products;
    }

    public async all(conn: Connection) {
        Util.log('BARTDBG: all method');
        if(this.productList[0] === '*ALL'){
            this.productList = new Set<string>();
            let productList = await Queries.queryAllProductNames(conn);
            for(let product of productList){
                this.productList.add(product['Name']);
            }
        }
        Util.setDir(this.dir);
        await Queries.retrieveQueryJson(this.dir);
        debugger;
        await this.retrievePriceBooks(conn, this.productList);
        Util.createAllDirs(this.isB2B, this.dir);

        await this.retrieveProduct(conn, this.productList);
        await this.retrieveCharges(conn, this.productList);
    
        if(this.isB2B){
           await this.retrieveProvisioningPlans(conn);
           await this.retrieveProvisioningTasks(conn);
        }
        await this.retrieveCategories(conn);
        await this.retrieveAttributes(conn);
        await this.retrieveAttributeSets(conn);
    } 

    private async retrieveProduct(conn: Connection, productList: Set<string>) {
        Util.showSpinner('products export');
        let productDefinitions = await Queries.queryProduct(conn, productList);
        let options = await Queries.queryProductOptions(conn, productList);
        let chargesIds = await Queries.queryProductChargesIds(conn, productList);
        let productAttributes = await Queries.queryProductAttributes(conn, productList);
        let attributeValues = await Queries.queryProductAttributeValues(conn, productList);
        let attributeDefaultValues = await Queries.queryAttributeDefaultValues(conn, productList);
        let attributeValueDependencies = await Queries.queryAttributeValueDependencies(conn, productList);
        let attributeRules = await Queries.queryAttributeRules(conn, productList);
        let productRelationships = await Queries.queryProductRelationships(conn, productList);


        const objectsToCheckTechId = [
            ...productDefinitions,
            ...options,
            ...productAttributes, 
            ...attributeValues, 
            ...attributeDefaultValues,
            ...attributeValueDependencies,
            ...attributeRules,
            ...productRelationships
        ];

        let provisioningPlanAssings:any = {};
        if(this.isB2B){
           provisioningPlanAssings = await Queries.queryProvisioningPlanAssigns(conn, productList);
           objectsToCheckTechId.push(...provisioningPlanAssings);
        }

        const objectsMissingTechId = Util.getObjectsMissingTechId(objectsToCheckTechId);

        if(objectsMissingTechId.length !== 0){
            objectsMissingTechId.forEach((object) => {
                Util.log(Util.OBJECT_MISSING_TECH_ID_ERROR + ': ' + object.Id);
            });
        }
       
        for(let productDefinition of productDefinitions){
           let product:any = {};
           let defTechId = productDefinition['enxCPQ__TECH_External_Id__c'];
           let techId = 'enxCPQ__TECH_External_Id__c';
           product.root = productDefinition;
           product.options = new Array<any>();
           product.chargesIds = new Array<any>();
           product.productAttributes = new Array<any>();
           product.attributeValues = new Array<any>();
           product.attributeDefaultValues = new Array<any>();
           product.attributeValueDependencies = new Array<any>();
           product.attributeRules = new Array<any>();
           product.productRelationships = new Array<any>();
           options.filter(option => option['enxCPQ__Parent_Product__r'] && option['enxCPQ__Parent_Product__r'][techId]===defTechId)
                  .forEach(option=> {product.options.push(option)}); 
            
           chargesIds.filter(chargeId => chargeId['enxCPQ__Root_Product__r'] && chargeId['enxCPQ__Root_Product__r'][techId]===defTechId)
                     .forEach(chargeId =>  {delete chargeId['enxCPQ__Root_Product__r']
                                            product.chargesIds.push(chargeId)});

           productAttributes.filter(productAttribute => productAttribute['enxCPQ__Product__r'] && productAttribute['enxCPQ__Product__r'][techId]===defTechId)
                            .forEach(productAttribute => {product.productAttributes.push(productAttribute)});
           
           attributeValues.filter(attributeValue => attributeValue['enxCPQ__Exclusive_for_Product__r'] && attributeValue['enxCPQ__Exclusive_for_Product__r'][techId]===defTechId) 
                          .forEach(attributeValue => {product.attributeValues.push(attributeValue)})

           attributeDefaultValues.filter(attributeDefaultValue => attributeDefaultValue['enxCPQ__Product__r'] && attributeDefaultValue['enxCPQ__Product__r'][techId]===defTechId)
                                 .forEach(attributeDefaultValue => {product.attributeDefaultValues.push(attributeDefaultValue)});
          
           attributeValueDependencies.filter(attributeValueDependency => attributeValueDependency['enxCPQ__Product__r'] && attributeValueDependency['enxCPQ__Product__r'][techId]===defTechId)
                                     .forEach(attributeValueDependency => {product.attributeValueDependencies.push(attributeValueDependency)});
           
           attributeRules.filter(attributeRule => attributeRule['enxCPQ__Product__r'] &&  attributeRule['enxCPQ__Product__r'][techId]===defTechId)
                          .forEach(attributeRule => { product.attributeRules.push(attributeRule)});
           
           productRelationships.filter(productRelationship => productRelationship['enxCPQ__Primary_Product__r'] && productRelationship['enxCPQ__Primary_Product__r'][techId]===defTechId)
                               .forEach(productRelationship => {product.productRelationships.push(productRelationship)});           
           
            if(this.isB2B){
                product.provisioningPlanAssings = new Array<any>();
                provisioningPlanAssings.filter(provisioningPlanAssing => provisioningPlanAssing['enxB2B__Product__r'] && provisioningPlanAssing['enxB2B__Product__r'][techId]===defTechId)
                                       .forEach(provisioningPlanAssing => {product.provisioningPlanAssings.push(provisioningPlanAssing)});
            }
           this.extractIds(product);
           Util.writeFile('/products/' +  Util.sanitizeFileName(product.root['Name']) + '_' + product.root['enxCPQ__TECH_External_Id__c'] + '.json', product);
   
           Util.hideSpinner('products export done'); 
      }
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
    private async retrieveCategoriesHelper(conn: Connection, categories:any){
        let parentCategoriesIds =  new Set<String>();

        for (let category of categories) {

            if(category['enxCPQ__Parent_Category__r'] && category['enxCPQ__Parent_Category__r'] !==null){
                parentCategoriesIds.add(category['enxCPQ__Parent_Category__r']['enxCPQ__TECH_External_Id__c']);
            }

            Util.writeFile('/categories/' + category['Name'] +'_' +category['enxCPQ__TECH_External_Id__c']+ '.json', category);
        }
        let newParentCategories = await Queries.queryCategories(conn, parentCategoriesIds);

        if(newParentCategories){
            this.retrieveCategoriesHelper(conn, newParentCategories);
        }
    }

    private async retrieveCategories(conn: Connection) {
        let categories = await Queries.queryCategories(conn, this.categoryIds);
        
        if(categories){
           await this.retrieveCategoriesHelper(conn, categories);
        }
    }

    private async retrieveAttributes(conn: Connection) {
        let attributes = await Queries.queryAttributes(conn, this.attributeIds);
        let attributeValues = await Queries.queryAttributeValues(conn, this.attributeIds);

        if(attributes){
            attributes.forEach(attribute => {
        
            let attributeToSave:any = {};
            attributeToSave.root = attribute;
            attributeToSave.values = new Array<any>();

            attributeValues.filter(attributeValue => attributeValue['enxCPQ__Attribute__r'] 
                                                     && attributeValue['enxCPQ__Attribute__r']['enxCPQ__TECH_External_Id__c'] === attribute['enxCPQ__TECH_External_Id__c'])
                           .forEach(attributeValue=>{attributeToSave.values.push(attributeValue)});     

            Util.writeFile('/attributes/' + Util.sanitizeFileName(attribute['Name']) + '_' + attribute['enxCPQ__TECH_External_Id__c']+ '.json', attributeToSave);
        })};
    }

    private async retrieveAttributeSets(conn: Connection) {
        let attributeSets = await Queries.queryAttributeSets(conn, this.attributeSetIds);
        let attributeSetAttributes = await Queries.queryAttributeSetAttributes(conn, this.attributeSetIds);

        if (attributeSets){
        attributeSets.forEach(attributeSet => {
        
            let attributeSetToSave:any = {};
            attributeSetToSave.root = attributeSet;
            attributeSetToSave.values = new Array<any>();

            attributeSetAttributes.filter(attributeSetAttribute => attributeSetAttribute['enxCPQ__Attribute_Set__r']
                                                                   && attributeSetAttribute['enxCPQ__Attribute_Set__r']['enxCPQ__TECH_External_Id__c'] === attributeSet['enxCPQ__TECH_External_Id__c'])
                                  .forEach(attributeSetAttribute => {attributeSetToSave.values.push(attributeSetAttribute)});     

                Util.writeFile('/attributeSets/' + Util.sanitizeFileName(attributeSet['Name']) +'_' + attributeSet['enxCPQ__TECH_External_Id__c']+ '.json', attributeSetToSave);
        });}
    }

    private async retrieveProvisioningPlans(conn: Connection) {
        let provisioningPlans = await Queries.queryProvisioningPlans(conn);
        let prvTaskAssignments = await Queries.queryProvisioningTaskAssignments(conn)
        
        provisioningPlans.forEach(provisioningPlan=>{
        
            let provisioningPlanToSave:any = {};
            provisioningPlanToSave.root = provisioningPlan;
            provisioningPlanToSave.values = new Array<any>();

            prvTaskAssignments.filter(prvTaskAssignment => prvTaskAssignment['enxB2B__Provisioning_Plan__r'] 
                                                           && prvTaskAssignment['enxB2B__Provisioning_Plan__r']['enxB2B__TECH_External_Id__c'] === provisioningPlan['enxB2B__TECH_External_Id__c'])
                              .forEach(prvTaskAssignment => {provisioningPlanToSave.values.push(prvTaskAssignment)});     

            Util.writeFile('/provisioningPlans/' + Util.sanitizeFileName(provisioningPlan['Name']) +'_' + provisioningPlan['enxB2B__TECH_External_Id__c']+ '.json', provisioningPlanToSave);
        });
    }
    
    private async retrieveProvisioningTasks(conn: Connection){
        let provisioningTasks = await Queries.queryProvisioningTasks(conn);

        provisioningTasks.forEach(provisioningTask => {
            Util.writeFile('/provisioningTasks/' + Util.sanitizeFileName(provisioningTask['Name']) +'_' + provisioningTask['enxB2B__TECH_External_Id__c']+ '.json', provisioningTask);
        });
    }

    private async retrievePriceBooks(conn: Connection, productList: Set<String>){
        debugger;
        let priceBooks = await Queries.queryPricebooks(conn);
        this.checkTechIds(priceBooks);

        let currencies = await Queries.queryPricebookEntryCurrencies(conn, productList);
        let priceBookEntries = await Queries.queryPricebookEntries(conn, productList);
        let stdPriceBookEntries = await Queries.queryStdPricebookEntries(conn, productList);
        let chargeElementPricebookEntries = await Queries.queryChargeElementPricebookEntries(conn, productList);
        let chargeElementStdPricebookEntries = await Queries.queryChargeElementStdPricebookEntries(conn, productList);
        
        

        // let objectsMissingTechId = Util.getObjectsMissingTechId([
        //     ...chargeElementPricebookEntries,
        //     ...chargeElementStdPricebookEntries,
        //     ...priceBooks, 
        //     ...priceBookEntries, 
        //     ...stdPriceBookEntries
        // ]);

        // if(objectsMissingTechId.length !== 0){
        //     debugger;
        //     objectsMissingTechId.forEach((object) => {
        //         Util.log(Util.OBJECT_MISSING_TECH_ID_ERROR + ': ' + object.Id);
        //     });
        // }

        if(priceBooks){
        priceBooks.forEach(priceBook => {

            const priceBookTechExtId = priceBook['enxCPQ__TECH_External_Id__c'];
            Util.createDir('./' + this.dir +'/priceBooks/' + Util.sanitizeFileName(priceBook['Name']));
            Util.writeFile('/priceBooks/' + Util.sanitizeFileName(priceBook['Name']) + '.json', priceBook)
            
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

                Util.writeFile('/priceBooks/' + Util.sanitizeFileName(priceBook['Name']) + '/' + currency + '.json', currencyToSave);
            });
        });}
    }

    private async retrieveCharges(conn: Connection, productList: Set<string>){
        let charges = await Queries.queryProductCharges(conn, productList);
        let chargeList = new Set<String>();
        charges.forEach(charge => {chargeList.add(charge['Name'])});

        let chargeElements = await Queries.queryChargeElements(conn, productList, chargeList);
        let chargeTiers = await Queries.queryChargeTiers(conn, productList, chargeList);
      
        for(let charge of charges){

            let chargeName = charge['Name'];
            let chargeToSave: any = {};
            let chargeElementsToSave: any = [];
            let chargeTiersToSave: any = [];
            chargeToSave.root= charge;
            
            chargeElements.filter(chargeElement => chargeElement['enxCPQ__Charge_Parent__r'] 
                                                   && chargeElement['enxCPQ__Charge_Parent__r']['enxCPQ__TECH_External_Id__c'] === charge['enxCPQ__TECH_External_Id__c'])
                          .forEach(chargeElementToSave=>{ chargeElementsToSave.push(chargeElementToSave)});

            chargeTiers.filter(chargeTier => chargeTier['enxCPQ__Charge_Parent__r']
                                             && chargeTier['enxCPQ__Charge_Parent__r']['enxCPQ__TECH_External_Id__c'] === charge['enxCPQ__TECH_External_Id__c'])
                       .forEach(chargeTierToSave=>{ chargeTiersToSave.push(chargeTierToSave)});              

            chargeToSave.chargeElements = chargeElementsToSave;
            chargeToSave.chargeTier = chargeTiersToSave;
            Util.writeFile('/charges/' + Util.sanitizeFileName(chargeName) + '.json', chargeToSave);
        }
    }

    private checkTechIds(objects: Array<any>){
        const objectsMissingTechId: Array<any> = Util.getObjectsMissingTechId(objects);
        if(objectsMissingTechId.length !== 0){
            debugger;
            objectsMissingTechId.forEach((object) => {
                Util.log(Util.OBJECT_MISSING_TECH_ID_ERROR + ': ' + object.Id);
            });
            Util.throwError(Util.OBJECT_MISSING_TECH_ID_ERROR);
        }
    }
}