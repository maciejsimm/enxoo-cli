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

export class ProductExporter {
    private categoryIds:Set<String>;
    private attributeIds:Set<String>;
    private attributeSetIds:Set<String>;
    private provisioningPlanIds:Set<String>;
    private provisioningTaskIds:Set<String>;
    private productList:Set<string>;
    private currencies:Set<String>;
    private currencyIsoCodes:Set<String>;
    private isB2B: boolean;
    private dir: string;
    private isRelated: boolean;

    constructor(products: Set<string>, isB2B: boolean, dir: string, isRelated: boolean, currencies: Set<String>) {
        this.categoryIds = new Set<String>();
        this.attributeIds = new Set<String>();
        this.attributeSetIds = new Set<String>();
        this.provisioningPlanIds = new Set<String>();
        this.provisioningTaskIds = new Set<String>();
        this.currencyIsoCodes = new Set<String>();
        this.dir = dir;
        this.isB2B = isB2B;
        this.productList = products;
        this.currencies = currencies;
        this.isRelated = isRelated;
    }

    public async all(conn: Connection) {
        if(this.productList[0] === '*ALL'){
            this.productList = new Set<string>();
            let productList = await Queries.queryAllProductNames(conn);
            for(let product of productList){
                this.productList.add(product['Name']);
            }
        }
        Queries.setIsRelated(this.isRelated);
        if(this.currencies){
            Queries.setCurrencies(this.currencies);
        }
        Util.setDir(this.dir);
        await Queries.retrieveQueryJson(this.dir);
        if(this.productList[0] !== '*ALL'){
            if(this.isRelated){
                await this.handleRetrievingRelatedAndBundleOptionProducts(conn, this.productList);
            } else{
                await this.retrieveBundleElementOptionsProducts(conn, this.productList);
            }
        } 
        await this.retrievePriceBooks(conn, this.productList);
        Util.createAllDirs(this.isB2B, this.dir);
        await this.retrieveProduct(conn, this.productList);
        await this.retrieveCharges(conn, this.productList);
        await this.retrieveBundleElements(conn, this.productList);
    
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
        this.checkTechIds(productDefinitions);

        let options = await Queries.queryProductOptions(conn, productList);
        this.checkTechIds(options);

        let chargesIds = await Queries.queryProductChargesIds(conn, productList);
        let bundleElementsIds = await Queries.queryBundleElementsIds(conn, productList);
        
        let productAttributes = await Queries.queryProductAttributes(conn, productList);
        this.checkTechIds(productAttributes);

        let attributeValues = await Queries.queryProductAttributeValues(conn, productList);
        this.checkTechIds(attributeValues);

        let attributeDefaultValues = await Queries.queryAttributeDefaultValues(conn, productList);
        this.checkTechIds(attributeDefaultValues);

        let attributeValueDependencies = await Queries.queryAttributeValueDependencies(conn, productList);
        this.checkTechIds(attributeValueDependencies);

        let attributeRules = await Queries.queryAttributeRules(conn, productList);
        this.checkTechIds(attributeRules);

        let productRelationships = await Queries.queryProductRelationships(conn, productList);
        this.checkTechIds(productRelationships);

        let provisioningPlanAssings:any = {};
        if(this.isB2B){
            provisioningPlanAssings = await Queries.queryProvisioningPlanAssigns(conn, productList);
            this.checkTechIds(provisioningPlanAssings);
        }
        let objectsToRemoveIds = [ ...productDefinitions, ...options, ...productAttributes, ...attributeValues, ...attributeDefaultValues,  ...attributeValueDependencies,
                                   ...attributeRules,  ...productRelationships];
        if(this.isB2B){
            objectsToRemoveIds = [...objectsToRemoveIds, ...provisioningPlanAssings];
        }     
        Util.removeIdFields(objectsToRemoveIds);
       
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
            
            if(this.isRelated){
                let chargeReferenceIds = this.retrieveReferenceChargesIds(chargesIds);
                chargeReferenceIds.forEach(chargeId => {product.chargesIds.push(chargeId)});
           };
          
           chargesIds.filter(chargeId => chargeId['enxCPQ__Root_Product__r'] && chargeId['enxCPQ__Root_Product__r'][techId]===defTechId)
                     .forEach(chargeId =>  {delete chargeId['enxCPQ__Root_Product__r'];
                                            delete chargeId['enxCPQ__Charge_Reference__r']
                                            product.chargesIds.push(chargeId)});

            product.bundleElementsIds = bundleElementsIds
                .filter(bundleElementId => (
                    bundleElementId['enxCPQ__Bundle__r'] && bundleElementId['enxCPQ__Bundle__r'][techId] === defTechId
                ))
                .map(bundleElementId => ({[techId]: bundleElementId[techId]}));

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
    private retrieveReferenceChargesIds(chargesIds: Array<String>){
        let chargeReferenceIds = chargesIds.filter(chargeId => chargeId['enxCPQ__Charge_Reference__r'])
                                           .map(chargeId => chargeId['enxCPQ__Charge_Reference__r'])
        return chargeReferenceIds;
    }

    private async retrieveSecondaryProducts(conn: Connection, productList: Set<string>){
        let secondaryProductNames =  new Set<string>();
        let secondaryProducts = await Queries.querySecondaryProducts(conn, productList);
        secondaryProducts.forEach( secondaryProduct => {
            secondaryProductNames.add(secondaryProduct['enxCPQ__Secondary_Product__r']['Name'])
        });
        if(secondaryProductNames.size > 0){
            let sizeBeforeMerge = this.productList.size;
            this.productList = new Set([... this.productList, ...secondaryProductNames]);
            let sizeAfterMerge = this.productList.size;
            if(sizeAfterMerge > sizeBeforeMerge){
                this.retrieveSecondaryProducts(conn, secondaryProductNames);
            }
        }
    }

    private async handleRetrievingRelatedAndBundleOptionProducts(connection: Connection, productNames: Set<string>){
        const productNamesBeforeRetrieve: Set<string> = new Set([...this.productList]);
        
        this.retrieveSecondaryProducts(connection, productNames);
        this.retrieveBundleElementOptionsProducts(connection, new Set([
            ...Util.getSetsDifference(this.productList, productNamesBeforeRetrieve),
            ...productNames
        ]));
        
        const newProductNames = Util.getSetsDifference(this.productList, productNamesBeforeRetrieve);

        if(newProductNames.size !== 0){
            this.handleRetrievingRelatedAndBundleOptionProducts(connection, newProductNames);
        }
    }

    private async retrieveBundleElementOptionsProducts(connection: Connection, bundleNames: Set<string>){
        const optionsObjectsWithProductNames = await Queries.queryBundleElementOptionsProductNames(connection, bundleNames);
        const productNames = new Set(optionsObjectsWithProductNames.map(optionWithProductName => (
            optionWithProductName['enxCPQ__Product__r']['enxCPQ__Root_Product__r']
                ? optionWithProductName['enxCPQ__Product__r']['enxCPQ__Root_Product__r']['Name']
                : optionWithProductName['enxCPQ__Product__r']['Name']
        )));

        this.productList = new Set([... this.productList, ...productNames]);
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
        this.checkTechIds(newParentCategories);

        Util.removeIdFields(newParentCategories);

        if(newParentCategories.length > 0){
            this.retrieveCategoriesHelper(conn, newParentCategories);
        }
    }

    private async retrieveCategories(conn: Connection) {
        let categories = await Queries.queryCategories(conn, this.categoryIds);
        this.checkTechIds(categories);

        Util.removeIdFields(categories);
        
        if(categories.length > 0){
           await this.retrieveCategoriesHelper(conn, categories);
        }
    }

    private async retrieveAttributes(conn: Connection) {
        let attributes = await Queries.queryAttributes(conn, this.attributeIds);
        this.checkTechIds(attributes);
        let attributeValues = await Queries.queryAttributeValues(conn, this.attributeIds);
        this.checkTechIds(attributeValues);

        Util.removeIdFields([
            ...attributes,
            ...attributeValues
        ]);

        if(attributes.length > 0){
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
        this.checkTechIds(attributeSets);

        let attributeSetAttributes = await Queries.queryAttributeSetAttributes(conn, this.attributeSetIds);
        this.checkTechIds(attributeSetAttributes);

        Util.removeIdFields([
            ...attributeSets,
            ...attributeSetAttributes
        ]);

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
        let provisioningPlans = await Queries.queryProvisioningPlans(conn, this.provisioningPlanIds);
        this.checkTechIds(provisioningPlans);
        let provisioningPlansList = new Set<String>();
        provisioningPlans.forEach(provisioningPlan => {provisioningPlansList.add(provisioningPlan['enxB2B__TECH_External_Id__c'])});
        let prvTaskAssignments = await Queries.queryProvisioningTaskAssignments(conn, provisioningPlansList);
        prvTaskAssignments.forEach(prvTaskAssignment => this.provisioningTaskIds.add(prvTaskAssignment['enxB2B__Provisioning_Task__r']['enxB2B__TECH_External_Id__c']));
        this.checkTechIds(prvTaskAssignments);

        Util.removeIdFields([
            ...provisioningPlans,
            ...prvTaskAssignments
        ]);

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
        let provisioningTasks = await Queries.queryProvisioningTasks(conn, this.provisioningTaskIds);
        this.checkTechIds(provisioningTasks);

        Util.removeIdFields(provisioningTasks);

        provisioningTasks.forEach(provisioningTask => {
            Util.writeFile('/provisioningTasks/' + Util.sanitizeFileName(provisioningTask['Name']) +'_' + provisioningTask['enxB2B__TECH_External_Id__c']+ '.json', provisioningTask);
        });
    }

    private async retrievePriceBooks(conn: Connection, productList: Set<String>){
        let priceBooks = await Queries.queryPricebooks(conn);
        this.checkTechIds(priceBooks.filter(pricebook => !pricebook['IsStandard']));

        await this.getCurrencyIsoCodes(conn, productList);
        let priceBookEntries = await Queries.queryPricebookEntries(conn, productList);
        let stdPriceBookEntries = await Queries.queryStdPricebookEntries(conn, productList);
        let chargeElementPricebookEntries = await Queries.queryChargeElementPricebookEntries(conn, productList);
        let chargeElementStdPricebookEntries = await Queries.queryChargeElementStdPricebookEntries(conn, productList);

        Util.removeIdFields(priceBooks);

        if(priceBooks){
        priceBooks.forEach(priceBook => {

            const priceBookTechExtId = priceBook['enxCPQ__TECH_External_Id__c'];
            Util.createDir('./' + this.dir +'/priceBooks/' + Util.sanitizeFileName(priceBook['Name']));
            Util.writeFile('/priceBooks/' + Util.sanitizeFileName(priceBook['Name']) + '.json', priceBook)

            this.currencyIsoCodes.forEach(currency=>{

                let currencyToSave:any = {};
                currencyToSave.entries = new Array<any>();
                currencyToSave.stdEntries = new Array<any>();
                currencyToSave.chargeElementPricebookEntries = new Array<any>();
                currencyToSave.chargeElementStdPricebookEntries = new Array<any>();
                
                if(priceBook['IsStandard']){
                    stdPriceBookEntries
                        .filter(stdPbe => currency === stdPbe['CurrencyIsoCode'])
                        .forEach(stdPbe=> currencyToSave.stdEntries.push(stdPbe));

                    chargeElementStdPricebookEntries
                        .filter(chargeElementStdPbe => currency === chargeElementStdPbe['CurrencyIsoCode'])
                        .forEach(chargeElementStdPbe => currencyToSave.chargeElementStdPricebookEntries.push(chargeElementStdPbe));
                } else{
                    priceBookEntries
                        .filter(pbe => pbe['Pricebook2'] && pbe['Pricebook2']['enxCPQ__TECH_External_Id__c'] === priceBookTechExtId 
                            && currency === pbe['CurrencyIsoCode'])
                        .forEach(pbe => currencyToSave.entries.push(pbe));

                    chargeElementPricebookEntries
                        .filter(chargeElementPbe => (
                            chargeElementPbe['Pricebook2'] 
                                && chargeElementPbe['Pricebook2']['enxCPQ__TECH_External_Id__c'] === priceBookTechExtId
                                && currency === chargeElementPbe['CurrencyIsoCode']
                        ))
                        .forEach(chargeElementPbe => currencyToSave.chargeElementPricebookEntries.push(chargeElementPbe));
                }
                
                Util.writeFile('/priceBooks/' + Util.sanitizeFileName(priceBook['Name']) + '/' + currency + '.json', currencyToSave);
            });
        });}
    }
    private async retrieveReferenceCharges(conn: Connection, charges: String[]){
        let referenceChargesIds =  new Set<string>();
        
        charges.filter(charge => charge['enxCPQ__Charge_Reference__r'])
               .forEach(charge => {referenceChargesIds.add(charge['enxCPQ__Charge_Reference__r']['enxCPQ__TECH_External_Id__c']) });
        let referenceCharges = await Queries.queryReferenceCharges(conn, referenceChargesIds);
        
        if(referenceChargesIds.size>0){
            charges = [...charges, ...referenceCharges];
        }
        return charges;
    }

    private async retrieveCharges(conn: Connection, productList: Set<string>){
        let charges = await Queries.queryProductCharges(conn, productList);
       
        if(this.isRelated){
            charges = await this.retrieveReferenceCharges(conn, charges);
        }

        this.checkTechIds(charges);

        let chargeList = new Set<String>();
        charges.forEach(charge => {chargeList.add(charge['Name'])});

        let chargeElements = await Queries.queryChargeElements(conn, productList, chargeList);
        this.checkTechIds(chargeElements);

        let chargeTiers = await Queries.queryChargeTiers(conn, productList, chargeList);
        this.checkTechIds(chargeTiers);

        Util.removeIdFields([
            ...charges,
            ...chargeElements,
            ...chargeTiers
        ]);
      
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

    private async retrieveBundleElements(connection: Connection, productList: Set<string>){
        let bundleElements = await Queries.queryBundleElements(connection, productList);
       
        this.checkTechIds(bundleElements);

        let bundleElementOptions = await Queries.queryBundleElementOptions(
            connection, 
            new Set(bundleElements.map(bundleElement => bundleElement['enxCPQ__TECH_External_Id__c']))
        );

        //let chargeList = new Set<String>();
        //charges.forEach(charge => {chargeList.add(charge['Name'])});

        /*let chargeElements = await Queries.queryChargeElements(conn, productList, chargeList);
        this.checkTechIds(chargeElements);

        let chargeTiers = await Queries.queryChargeTiers(conn, productList, chargeList);
        this.checkTechIds(chargeTiers);
        */
        
        //check if it is necessary
        Util.removeIdFields([
            ...bundleElements,
            ...bundleElementOptions
        ]);

        for(let bundleElement of bundleElements){
            const bundleElementOptionsToSave = bundleElementOptions.filter(option => (
                option['enxCPQ__Bundle_Element__r'] && option['enxCPQ__Bundle_Element__r']['enxCPQ__TECH_External_Id__c'] === bundleElement['enxCPQ__TECH_External_Id__c']
            ));
            const elementToSave = {
                root: bundleElement,
                bundleElementOptions: bundleElementOptionsToSave
            }

            const filePath = '/bundleElements/' + Util.sanitizeFileName(bundleElement['Name']) + '_' + bundleElement['enxCPQ__TECH_External_Id__c'] + '.json';
            Util.writeFile(filePath, elementToSave);
        }
      
        /*for(let charge of charges){

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
        }*/
    }

    private checkTechIds(objects: Array<any>): void{
        const objectsMissingTechId: Array<any> = Util.getObjectsMissingTechId(objects);
        if(objectsMissingTechId.length !== 0){
            objectsMissingTechId.forEach((object) => {
                Util.log(Util.OBJECT_MISSING_TECH_ID_ERROR + ' Id: ' + object.Id);
            });
            Util.throwError(Util.OBJECT_MISSING_TECH_ID_ERROR);
        }
    }

    private async getCurrencyIsoCodes(conn: Connection, productList: Set<String>){
        let currencies = this.currencies
        ? this.currencies
        : await Queries.queryPricebookEntryCurrencies(conn, productList);

        if(!this.currencies){
            currencies.forEach(currency =>{this.currencyIsoCodes.add(currency['CurrencyIsoCode'])});
        }else{
            this.currencyIsoCodes = new Set(currencies);
        }
    }
}