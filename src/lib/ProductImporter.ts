// Class responsible for Importing product data into an org

import * as fs from 'fs';
import { Util } from './Util';
import { Connection } from 'jsforce';
import { Queries } from './query';
import { Upsert } from './upsert';
import * as _ from 'lodash';

export class ProductImporter {
    private categoryIds:Set<String>;
    private stdPricebookEntryIds:Array<string>;
    private pricebookEntryIds:Array<string>;
    private attributeIds:Set<String>;
    private attributeSetIds:Set<String>;
    private productAttributesIds:Array<string>;
    private sourcePricebooksIds:Array<Object>;
    private sourceProductIds:Set<String>;
    private targetPricebooksIds:Array<Object>;
    private targetProductIds:Array<Object>;
    private products:Array<Object>;
    private productsRoot:Array<Object>; 
    private categories:Array<Object>;
    private attributes:Array<Object>;
    private attributeSets:Array<Object>;
    private attributeSetAttributes:Array<Object>;
    private prdAttributeValues:Array<Object>;
    private attributeValues:Array<Object>;
    private allCategoriesChild:Array<Object>;
    private productAttributes:Array<Object>;
    private pricebooks:Array<Object>;
    private stdPbes:Array<Object>;
    private pbes:Array<Object>;
    private productRelationships:Array<Object>;
    private attributeDefaultValues:Array<Object>;
    private attributeValueDependencies:Array<Object>;
    private attributeRules:Array<Object>;
    private provisioningPlans:Array<Object>;
    private provisioningTasks:Array<Object>;
    private provisioningPlanAssignmentIds:Array<string>;
    private provisioningTaskAssignmentIds:Array<string>;
    private provisioningPlanAssignments:Array<Object>;
    private provisioningTaskAssignments:Array<Object>;
    private productList:Set<string>;
    private productOptions:Array<Object>;
    private charges:Array<Object>;
    private chargesWithoutReference:Array<Object>;
    private chargesIds:Set<String>;
    private chargeElements:Array<Object>;
    private chargeTiers:Array<Object>;
    private provisionigPlansIds:Set<String>;
    private attributeDefaultValuesIds:Set<String>;
    private isB2B: boolean;
    private dir: string;
    private userName: string;

    constructor(products: Set<string>, isB2B: boolean, dir: string, userName: string){
        this.userName = userName;
        this.dir = dir;
        this.productList = products;
        this.isB2B = isB2B;
        this.attributeDefaultValuesIds = new Set<String>();
        this.chargesIds = new Set<String>();
        this.productOptions = new Array<Object>();
        this.charges = new Array<Object>();
        this.chargesWithoutReference = new Array<Object>();
        this.chargeElements = new Array<Object>();
        this.chargeTiers = new Array<Object>();
        this.products = new Array<Object>();
        this.sourcePricebooksIds = new Array<Object>();
        this.sourceProductIds = new Set<String>();
        this.targetProductIds = new Array<Object>();
        this.targetPricebooksIds = new Array<Object>();
        this.attributeSetAttributes = new Array<Object>();
        this.categories = new Array<Object>();
        this.attributes = new Array<Object>();
        this.attributeSets = new Array<Object>();
        this.productsRoot = new Array<Object>();
        this.prdAttributeValues = new Array<Object>();
        this.attributeValues = new Array<Object>();
        this.allCategoriesChild = new  Array<Object>();
        this.productAttributes = new Array<Object>();
        this.pricebooks = new Array<Object>();
        this.provisioningPlanAssignments = new Array<Object>();
        this.provisioningTaskAssignments = new Array<Object>();
        this.provisioningPlanAssignmentIds= new Array<string>();
        this.provisioningTaskAssignmentIds = new Array<string>();
        this.provisioningTasks = new Array<Object>();
        this.provisioningPlans = new Array<Object>();
        this.attributeRules = new Array<Object>();
        this.attributeValueDependencies = new Array<Object>();
        this.attributeDefaultValues = new Array<Object>();
        this.productRelationships = new Array<Object>();
        this.stdPbes = new Array<Object>();
        this.pbes = new Array<Object>();
        this.stdPricebookEntryIds = new Array<string>();
        this.pricebookEntryIds= new Array<string>();
        this.categoryIds = new Set<String>();
        this.productAttributesIds = new Array<string>(); 
        this.attributeIds = new Set<String>();
        this.attributeSetIds = new Set<String>();
        this.provisionigPlansIds = new Set<String>();
    }
    
    public async all(conn:Connection) { 
      conn.setMaxListeners(100);      
      Util.setDir(this.dir);
      
      if(this.productList[0] === '*ALL'){
          this.productList = await Util.retrieveAllFileName();
      }
      await Upsert.enableTriggers(conn);
      await Upsert.disableTriggers(conn, this.userName);  
      await this.extractProduct(conn);
      await this.extractData(conn);
      await this.extractPricebooks();
     
      //Perform an upsert of data
      try {
          await Upsert.upsertObject(conn, 'enxCPQ__Category__c', this.allCategoriesChild);
          await Upsert.upsertObject(conn, 'enxCPQ__Category__c', this.categories);
          await Upsert.upsertObject(conn, 'enxCPQ__Attribute__c', this.attributes);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeSet__c', this.attributeSets);
          await Upsert.upsertObject(conn, 'Product2', this.productsRoot);
          await Upsert.upsertObject(conn, 'Product2', this.productOptions);
          await Upsert.upsertObject(conn, 'Product2', this.chargesWithoutReference);
          await Upsert.upsertObject(conn, 'Product2', this.charges);
          await Upsert.upsertObject(conn, 'Product2', this.chargeElements);
          await Upsert.upsertObject(conn, 'Product2', this.chargeTiers);
          this.targetProductIds = await this.retrieveTargerProductIds(conn);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeSetAttribute__c', this.attributeSetAttributes);
          await Upsert.deleteObject(conn, 'enxCPQ__ProductAttribute__c', this.productAttributesIds);
          await Upsert.upsertObject(conn, 'enxCPQ__ProductAttribute__c', this.productAttributes);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeValue__c', this.prdAttributeValues);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeValue__c', this.attributeValues);
          let pricebooks = this.retrieveNonStandardPricebooks();
          await Upsert.upsertObject(conn, 'Pricebook2', pricebooks);
          this.targetPricebooksIds = await this.retrieveTargetPricebookIds(conn);
          Upsert.mapPricebooks(this.sourcePricebooksIds,  this.targetPricebooksIds);
          Upsert.mapProducts(this.sourceProductIds, this.targetProductIds);
         
          await Upsert.deleteObject(conn, 'PricebookEntry', this.pricebookEntryIds);
          await Upsert.deleteObject(conn, 'PricebookEntry', this.stdPricebookEntryIds);
         
          await Upsert.insertObject(conn, 'PricebookEntry', this.stdPbes);
          await Upsert.insertObject(conn, 'PricebookEntry', this.pbes);
          
          await Upsert.upsertObject(conn, 'enxCPQ__ProductRelationship__c', this.productRelationships);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeDefaultValue__c', this.attributeDefaultValues);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeValueDependency__c', this.attributeValueDependencies);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeRule__c', this.attributeRules);
          if(this.isB2B){
             await Upsert.upsertObject(conn, 'enxB2B__ProvisioningPlan__c', this.provisioningPlans);
             await Upsert.upsertObject(conn, 'enxB2B__ProvisioningTask__c', this.provisioningTasks)
           
             await Upsert.deleteObject(conn, 'enxB2B__ProvisioningPlanAssignment__c', this.provisioningPlanAssignmentIds);
             await Upsert.deleteObject(conn, 'enxB2B__ProvisioningTaskAssignment__c', this.provisioningTaskAssignmentIds);
            
             await Upsert.insertObject(conn, 'enxB2B__ProvisioningPlanAssignment__c', this.provisioningPlanAssignments);
             await Upsert.upsertObject(conn, 'enxB2B__ProvisioningTaskAssignment__c', this.provisioningTaskAssignments);
          }
          await Upsert.enableTriggers(conn);
      } catch (ex) {
          Util.log(ex);
      }     
}

    private retrieveNonStandardPricebooks(){
        return this.pricebooks.filter(pricebook => pricebook['Name'] !== 'Standard Price Book');
    }

    private async retrieveTargerProductIds(conn: Connection){
        let targetProductIds = new Array<Object>();
        let prdIdsTarget = await Queries.queryProductIds(conn, this.productList); 
        prdIdsTarget.forEach(prdIdTarget =>{
            let productDataToExtract =
            {
                Id: prdIdTarget['Id'],
                techId: prdIdTarget['enxCPQ__TECH_External_Id__c']
        
            }
        targetProductIds.push(productDataToExtract);
        });
        return targetProductIds;
    }

    private async retrieveTargetPricebookIds(conn: Connection){
        let targetPricebooksIds = new Array<Object>();
        let pricebooksTarget = await Queries.queryPricebooksIds(conn);
        pricebooksTarget.forEach(pricebookTarget => {
            let pricebookDataToExtract =
            {
                Id: pricebookTarget['Id'],
                techId: pricebookTarget['enxCPQ__TECH_External_Id__c'],
                IsStandard: pricebookTarget['IsStandard']
            }    
            targetPricebooksIds.push(pricebookDataToExtract);
        });
        return targetPricebooksIds;
    }

    private extractParentCategories(categories: any, allCategories:any){
        let parentCategoriesIds =  new Set<String>();
        categories.filter(category => category['enxCPQ__Parent_Category__r'])
                  .forEach(category => parentCategoriesIds.add(category['enxCPQ__Parent_Category__r']['enxCPQ__TECH_External_Id__c']));
        
        let newCategories =[];
    
        for (let i=0; i<allCategories.length; i++ ){
             for(let parentCategoriesId of parentCategoriesIds){
                if(allCategories[i]['enxCPQ__TECH_External_Id__c'] === parentCategoriesId){
                    newCategories.push(allCategories[i]);
                    this.allCategoriesChild.push(allCategories[i]);
                }
            }
        }
        if(newCategories.length > 0){
            this.extractParentCategories(newCategories, allCategories);
        }
    }

    private extractProvisionigPlansIds(product:any){
        let provisionigPlansIds = new Set<String>();
        if(product.provisioningPlanAssings){
            product.provisioningPlanAssings.forEach(prvPlanAssing => {provisionigPlansIds.add(prvPlanAssing['enxB2B__Provisioning_Plan__r']['enxB2B__TECH_External_Id__c'])});
        }

        return provisionigPlansIds;
    }
    private extractAttributeDefaultValuesIds(product:any){
        let attributeDefaultValuesIds = new Set<String>();
        if(product.attributeValueDependencies){
            product.attributeValueDependencies.filter(atrValueDependency => atrValueDependency['enxCPQ__Master_Attribute__r'])
                                              .forEach(atrValueDependency => {attributeDefaultValuesIds.add(atrValueDependency['enxCPQ__Master_Attribute__r']['enxCPQ__TECH_External_Id__c'])});
        }

        return attributeDefaultValuesIds;
    }
    private extractSourceProductIds(product:any){
        let sourceProductIds = new Set<String>();
        if(product.chargesIds){
            product.chargesIds.forEach(chargesId => {sourceProductIds.add(chargesId['enxCPQ__TECH_External_Id__c'])});
        }
        sourceProductIds.add(product.root.enxCPQ__TECH_External_Id__c);
        if(product.options){
            product.options.forEach(option => {sourceProductIds.add(option.enxCPQ__TECH_External_Id__c)});
        }

        return sourceProductIds;
    }
    private extractChargesIds(product:any){
        let chargesIds = new Set<String>();
        if(product.chargesIds){
            product.chargesIds.forEach(chargesId => {chargesIds.add(chargesId['enxCPQ__TECH_External_Id__c'])});
        }

        return chargesIds;
    }

    private extractCategoryIds(product:any){
        let categoryIds = new Set<String>();
        if(product.root.enxCPQ__Category__r){
            categoryIds.add(product.root.enxCPQ__Category__r.enxCPQ__TECH_External_Id__c);
        }
        return categoryIds;
    }
    private extractAttributeIds(product:any){
        let attributeIds = new Set<String>();
        if(product.productAttributes){
            product.productAttributes.forEach(attr => {attributeIds.add(attr.enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c)});
        }

        return attributeIds;
    }
    
    private extractAttributeSetIds(product:any){
        let attributeSetIds = new Set<String>();
        if(product.productAttributes){
            product.productAttributes.filter(attr => attr['enxCPQ__Attribute_Set__r'])
                                     .forEach(attr =>  attributeSetIds.add(attr.enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c));
        }

        return attributeSetIds;
    }

    private deleteJsonFields(object: any, firstPropertyToDelete: string, arrayToPush: any, secondPropertyToDelete: string){
        if(object){
           let cloneObject = {...object};
           delete cloneObject[firstPropertyToDelete];
           delete cloneObject[secondPropertyToDelete];
           arrayToPush.push(cloneObject);
        }
    }
    
    private extractProductObjects(objectsArray:any, objectIds:Set<String>) {
        let result:Array<any> = new Array<any>();
        let objectIdsArr = Array.from(objectIds.values());
        
        for (let j = 0; j < objectIdsArr.length; j++) {
            for (let i = 0; i < objectsArray.length; i++) {
                if (objectsArray[i]['enxCPQ__TECH_External_Id__c'] === objectIdsArr[j]) {
                    let object:any = objectsArray[i];
                    result.push(object);
                    break;
                }
                if (objectsArray[i]['root'] && objectsArray[i]['root']['enxCPQ__TECH_External_Id__c'] === objectIdsArr[j]) {
                    let object:any = objectsArray[i];
                    result.push(object);
                    break;
                }
            }
        }
        return result;
    }

    private extractPricebookData(pricebook: any){
        let sourcePricebooksIds = Array<Object>();
        let pricebookDataToExtract =
        {
            techId: pricebook.enxCPQ__TECH_External_Id__c,
            IsStandard: pricebook.IsStandard
        }
        sourcePricebooksIds.push(pricebookDataToExtract);

        return sourcePricebooksIds;
    }

    private extractObjects(objectsArray:any, objectIds:Set<String>, object?: string, isBreak: Boolean = true){
        let result:Array<any> = new Array<any>();
        for (let objectId of objectIds) {
            for (let i = 0; i < objectsArray.length; i++) {
                if (object && objectsArray[i][object] && objectsArray[i][object].enxCPQ__TECH_External_Id__c === objectId) {
                    let object:any = objectsArray[i];
                    result.push(object);
                    if(isBreak){
                       break;
                    }
                }else if(objectsArray[i].enxB2B__TECH_External_Id__c === objectId){
                    let object:any = objectsArray[i];
                    result.push(object);
                    break;
                }else if (objectsArray[i].root && objectsArray[i].root.enxB2B__TECH_External_Id__c === objectId) {
                    let object:any = objectsArray[i];
                    result.push(object);
                    break;
                }
            }
        }
        return result;
    }
    
    private async readProduct(prodname:String) {
        let content;
        return new Promise<string>((resolve: Function, reject: Function) => {
            fs.readFile('./'+this.dir +'/products/' + prodname, function read(err, data) {
                if (err) {
                    reject(err);
                }
                content = data.toString('utf8');
                resolve(JSON.parse(content));
            });
        });
    }
    
    private async extractProduct(conn: Connection) {
        let productFileNameList= new Set<String>();
        // We need to query ID's of records in target org in order to delete or match ID's
        let prdAttrsTarget = await Queries.queryProductAttributeIds(conn, this.productList);                 // for delete                           
        let allStdPricebookEntriesTarget = await Queries.queryStdPricebookEntryIds(conn, this.productList);  // for delete
        let allPricebookEntriesTarget = await Queries.queryPricebookEntryIds(conn, this.productList);        // for delete
        prdAttrsTarget.forEach(prdAttr => {this.productAttributesIds.push(prdAttr['Id'])});
        allStdPricebookEntriesTarget.forEach(stdPbeTarget => {this.stdPricebookEntryIds.push(stdPbeTarget['Id'])});
        allPricebookEntriesTarget.forEach(pbeTarget => {this.pricebookEntryIds.push(pbeTarget['Id'])});

        for (let productName of this.productList){
            let prdNames = await Util.matchFileNames(productName);
            productFileNameList = new Set([...productFileNameList, ...prdNames]);
        }
        // Collect all Ids' of products that will be inserted
        for (let prodname of productFileNameList) {
            const prod = await this.readProduct(prodname);
            this.categoryIds = new Set([...this.categoryIds, ...this.extractCategoryIds(prod)]);
            this.attributeDefaultValuesIds = new Set([...this.attributeDefaultValuesIds, ...this.extractAttributeDefaultValuesIds(prod)]);
            this.attributeIds = new Set([...this.attributeIds, ...this.extractAttributeIds(prod)]);
            this.attributeSetIds = new Set([...this.attributeSetIds, ...this.extractAttributeSetIds(prod)]);
            this.sourceProductIds = new Set([...this.sourceProductIds, ...this.extractSourceProductIds(prod)]);
            this.chargesIds = new Set([...this.chargesIds, ...this.extractChargesIds(prod)]);
            if(this.isB2B){
                this.provisionigPlansIds = new Set([...this.provisionigPlansIds, ...this.extractProvisionigPlansIds(prod)]);
            }
            this.products.push(prod);
        }
 
        // Building lists of records to upsert on target org
        for (let product of this.products) {
            delete product['root']['Id'];
            this.productsRoot.push(product['root']);

            if(product['attributeValues']) {product['attributeValues'].forEach(attributeValue=> {this.prdAttributeValues.push(attributeValue)})};
            if(product['options']) {product['options'].forEach(productOption=> {this.productOptions.push(productOption)})};
            if(product['productAttributes']) {product['productAttributes'].forEach(productAttribute=> {this.productAttributes.push(productAttribute)})};
            if(product['productRelationships']) {product['productRelationships'].forEach(productRelationship=> {this.productRelationships.push(productRelationship)})};
            if(product['attributeDefaultValues']) {product['attributeDefaultValues'].forEach(attributeDefaultValue=> {this.attributeDefaultValues.push(attributeDefaultValue)})};
            if(product['attributeValueDependencies']) {product['attributeValueDependencies'].forEach(attributeValueDependency=> {this.attributeValueDependencies.push(attributeValueDependency)})};
            if(product['attributeRules']) {product['attributeRules'].forEach(attributeRule=> { this.attributeRules.push(attributeRule)})};
 
            if(this.isB2B){
                if(product['provisioningPlanAssings']) {product['provisioningPlanAssings'].forEach(provisioningPlanAssignment=> { this.provisioningPlanAssignments.push(provisioningPlanAssignment)})};
            }
        }
    }

    private async extractPricebooks() {
       // reading data for every pricebook
       let dirNames = await Util.readDirNames('/pricebooks');
       let allPbes = [];
   
       for(let dirName of dirNames){
           if(dirName=== 'Standard Price Book' ){continue;}                        // <- to jest hardkod!!!
           let pbes = await Util.readAllFiles('/pricebooks/' + dirName);
           allPbes.push(pbes);
       }
       Util.showSpinner('---extracting PricebookEntry ids');
       for(let pbes of allPbes){
           for(let pbe of pbes){
               if(!this.isB2B){
                  Util.removeB2BFields(pbe['entries']);
                  
                  Util.removeB2BFields(pbe['chargeElementPricebookEntries']);
               }
               this.pbes.push(...this.extractObjects(pbe['entries'], this.sourceProductIds, 'Product2'));
               this.pbes.push(...this.extractObjects(pbe['chargeElementPricebookEntries'], this.sourceProductIds, 'Product2'));
           }
       }    
       let stdPbes = await Util.readAllFiles('/pricebooks/Standard Price Book');
       stdPbes.forEach(allstdpbe => {!this.isB2B ? Util.removeB2BFields(allstdpbe['stdEntries']) : null,
                                     this.stdPbes.push(...this.extractObjects(allstdpbe['stdEntries'], this.sourceProductIds, 'Product2'))});

       stdPbes.forEach(allstdpbe => {!this.isB2B ? Util.removeB2BFields(allstdpbe['chargeElementStdPricebookEntries']) : null,
                                     this.stdPbes.push(...this.extractObjects(allstdpbe['chargeElementStdPricebookEntries'], this.sourceProductIds, 'Product2'))});
        Util.hideSpinner('---extraction of PricebookEntry ids done');
    }

    private async extractData(conn: Connection) {
        //  Read all other than pricebook and product objects from local store
        const allCategories = await Util.readAllFiles('/categories');
        let allCharges = await Util.readAllFiles('/charges');
        let allAttributes = await Util.readAllFiles('/attributes');
        let allAttributeSets = await Util.readAllFiles('/attributeSets');
        let allPricebooks = await Util.readAllFiles('/pricebooks');
        let attributeSetsRoot:any = [];
        let attributeSetAttributes:any = [];
        allAttributeSets.forEach(attributeSet => {attributeSetsRoot.push(attributeSet['root']);
                                                  if(attributeSet['values']) {attributeSet['values'].forEach(attrSetAttr => {attributeSetAttributes.push(attrSetAttr)})}});
        if(this.isB2B){
            await this.extractB2BObjects(conn);
        } 
        let attributesRoot:any = [];
        let attributeValues:any = [];
        allAttributes.forEach(attr => {attributesRoot.push(attr['root']);
                                       if(attr['values']){attr['values'].forEach(attrValue => {attributeValues.push(attrValue)})}});
       
        allPricebooks.forEach(pricebook=>{this.sourcePricebooksIds = [...this.sourcePricebooksIds,...this.extractPricebookData(pricebook)],
                                          this.deleteJsonFields(pricebook, 'Id',  this.pricebooks, 'IsStandard')});

        let productCharges = [...this.extractProductObjects(allCharges, this.chargesIds)];
    
        productCharges.forEach(charge=>{if(charge['root']['enxCPQ__Charge_Reference__r']){ this.charges.push(charge['root'])}
                                        else{this.chargesWithoutReference.push(charge['root'])};
                                        if(charge['chargeElements']){charge['chargeElements'].forEach(chargeElement =>{this.chargeElements.push(chargeElement)})};
                                        if(charge['chargeTier']){charge['chargeTier'].forEach(chargeTier =>{this.chargeTiers.push(chargeTier)})}});

        this.chargeElements.forEach(chargeElement => {this.sourceProductIds.add(chargeElement['enxCPQ__TECH_External_Id__c'])});
        this.chargeTiers.forEach(chargeTier =>{this.sourceProductIds.add(chargeTier['enxCPQ__TECH_External_Id__c'])});
        this.categories.push(...this.extractProductObjects(allCategories, this.categoryIds));


        this.allCategoriesChild = [...this.categories];
        this.extractParentCategories(this.categories, allCategories);
        this.allCategoriesChild.forEach(category => {delete category['enxCPQ__Parent_Category__r']});
        this.attributes.push(...this.extractProductObjects(attributesRoot, this.attributeIds));
        attributeValues.forEach(attributeValue => {  this.attributeValues.push(attributeValue)});
        //attributeValues.forEach(attributeValue => {  this.attributeValues.push(...this.extractObjects(attributeValue, this.attributeIds, 'enxCPQ__Attribute__r', false))} )
        this.attributeSets.push(...this.extractProductObjects(attributeSetsRoot, this.attributeSetIds));
        this.attributeSetAttributes.push(...this.extractObjects(attributeSetAttributes, this.attributeSetIds, 'enxCPQ__Attribute_Set__r', false));       
    }

    private async extractB2BObjects(conn: Connection){
        //reading B2B objects from local store
        let allProvisioningPlans = await Util.readAllFiles('/provisioningPlans');
        let allProvisioningTasks = await Util.readAllFiles('/provisioningTasks');     
        let planAssignmentsTarget = await Queries.queryProvisioningPlanAssignmentIds(conn, this.sourceProductIds);
        let provisioningPlanTechIds =  new Set<String>();
        planAssignmentsTarget.filter(planAssignmentsTarget => planAssignmentsTarget['enxB2B__Provisioning_Plan__r'])
                             .forEach(planAssignmentsTarget =>{ provisioningPlanTechIds.add(planAssignmentsTarget['enxB2B__Provisioning_Plan__r']['enxB2B__TECH_External_Id__c']) });
        let taskAssignmentsTarget = await Queries.queryProvisioningTaskAssignmentIds(conn, provisioningPlanTechIds);
    
        planAssignmentsTarget.forEach(planAssignmentTarget => {this.provisioningPlanAssignmentIds.push(planAssignmentTarget['Id'])});
        taskAssignmentsTarget.forEach(taskAssignmentTarget => {this.provisioningTaskAssignmentIds.push(taskAssignmentTarget['Id'])});
        let provisioningPlans = [...this.extractObjects(allProvisioningPlans, this.provisionigPlansIds)];
        provisioningPlans.forEach(provisioningPlan => {
        this.provisioningPlans.push(provisioningPlan['root']);
                                if(provisioningPlan['values']){ provisioningPlan['values'].forEach(value => { this.provisioningTaskAssignments.push(value)})}});
        allProvisioningTasks.forEach(prvTask =>{this.provisioningTasks.push(prvTask)});
    }
}
