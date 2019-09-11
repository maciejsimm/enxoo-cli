// Class responsible for Importing product data into an org

import {core} from '@salesforce/command';
import * as fs from 'fs';
import { Util } from './Util';
import { RecordResult } from 'jsforce';
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
    private attributeSetsRoot:Array<Object>;
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
    private productList:Array<string>;
    private productOptions:Array<Object>;
    private charges:Array<Object>;
    private chargesIds:Set<String>;
    private chargeElements:Array<Object>;
    private chargeTiers:Array<Object>;
    private provisionigPlansIds:Set<String>;
    private provisioningTaskIds:Set<String>;

    constructor(products: Array<string>){
        this.productList = products;
        this.chargesIds = new Set<String>();
        this.productOptions = new Array<Object>();
        this.charges = new Array<Object>();
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
        this.attributeSetsRoot = new Array<Object>();
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
        this.provisioningTaskIds = new Set<String>();
    }
    
    public async all(conn: core.Connection) {       
        
      conn.setMaxListeners(100);
  
      await Upsert.enableTriggers(conn);
      await Upsert.disableTriggers(conn);  
  
      await this.extractProduct(conn);
      await this.extractData(conn);
      await this.extractPricebooks();
  
      console.log('products to upsert: ' + this.products.length);
      console.log('categories to upsert: ' + this.allCategoriesChild.length);
      console.log('attributes to upsert: ' + this.attributes.length);      
      console.log('attributeSets to upsert: ' + this.attributeSets.length);      
     
      //Perform an upsert of data
      try {
          await Upsert.upsertObject(conn, 'enxCPQ__Category__c', this.allCategoriesChild);
          await Upsert.upsertObject(conn, 'enxCPQ__Category__c', this.categories);
          await Upsert.upsertObject(conn, 'enxCPQ__Attribute__c', this.attributes);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeSet__c', this.attributeSetsRoot);
          await Upsert.upsertObject(conn, 'Product2', this.productsRoot);
          await Upsert.upsertObject(conn, 'Product2', this.productOptions);
          await Upsert.upsertObject(conn, 'Product2', this.charges);
          await Upsert.upsertObject(conn, 'Product2', this.chargeElements);
          await Upsert.upsertObject(conn, 'Product2', this.chargeTiers);
  
          for (let productName of this.productList){
              let prdIdsTarget = await Queries.queryProductIds(conn, productName); 
              for(let prdIdTarget of prdIdsTarget){
                  let productDataToExtract =
                  {
                      Id: prdIdTarget['Id'],
                      enxCPQ__TECH_External_Id__c: prdIdTarget['enxCPQ__TECH_External_Id__c']
          
                  }
              this.targetProductIds.push(productDataToExtract);
              }
          }
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeSetAttribute__c', this.attributeSetAttributes);
          await Upsert.deleteObject(conn, 'enxCPQ__ProductAttribute__c', this.productAttributesIds);
          await Upsert.upsertObject(conn, 'enxCPQ__ProductAttribute__c', this.productAttributes);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeValue__c', this.prdAttributeValues);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeValue__c', this.attributeValues);
          let pricebooks = this.pricebooks.filter(pricebook => pricebook['Name'] !== 'Standard Price Book');
          await Upsert.upsertObject(conn, 'Pricebook2', pricebooks);
          
          let pricebooksTarget = await Queries.queryPricebooksIds(conn);
          for(let pricebookTarget of pricebooksTarget){
              let pricebookDataToExtract =
              {
                  Id: pricebookTarget['Id'],
                  enxCPQ__TECH_External_Id__c: pricebookTarget['enxCPQ__TECH_External_Id__c'],
                  IsStandard: pricebookTarget['IsStandard']
              }    
              this.targetPricebooksIds.push(pricebookDataToExtract);
          }
          Upsert.mapPricebooks(this.sourcePricebooksIds,  this.targetPricebooksIds);
          Upsert.mapProducts(this.sourceProductIds, this.targetProductIds);
         
          await Upsert.deleteObject(conn, 'PricebookEntry', this.pricebookEntryIds);
          await Upsert.deleteObject(conn, 'PricebookEntry', this.stdPricebookEntryIds);
         
          await Upsert.upsertBulkPricebookEntries(conn, this.stdPbes);
          await Upsert.upsertBulkPricebookEntries(conn, this.pbes)
          
          await Upsert.upsertObject(conn, 'enxCPQ__ProductRelationship__c', this.productRelationships);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeDefaultValue__c', this.attributeDefaultValues);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeValueDependency__c', this.attributeValueDependencies);
          await Upsert.upsertObject(conn, 'enxCPQ__AttributeRule__c', this.attributeRules);
          await Upsert.upsertObject(conn, 'enxB2B__ProvisioningPlan__c', this.provisioningPlans);
          await Upsert.upsertObject(conn, 'enxB2B__ProvisioningTask__c', this.provisioningTasks)
        
          await Upsert.deleteObject(conn, 'enxB2B__ProvisioningPlanAssignment__c', this.provisioningPlanAssignmentIds);
          await Upsert.deleteObject(conn, 'enxB2B__ProvisioningTaskAssignment__c', this.provisioningTaskAssignmentIds);
         
          await Upsert.insertObject(conn, 'enxB2B__ProvisioningPlanAssignment__c', this.provisioningPlanAssignments);
          await Upsert.insertObject(conn, 'enxB2B__ProvisioningTaskAssignment__c', this.provisioningTaskAssignments);
          await Upsert.enableTriggers(conn);
      } catch (ex) {
          Util.log(ex);
      }     
} 

    private extractParentCategories(categories: any, allCategories:any ){
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
    
    private extractIds(product:any) {
        if(product.root.enxCPQ__Category__r){
            this.categoryIds.add(product.root.enxCPQ__Category__r.enxCPQ__TECH_External_Id__c);
        }
       
        for (let attr of product.productAttributes) {
            this.attributeIds.add(attr.enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c);
            if (attr['enxCPQ__Attribute_Set__r']) {
                this.attributeSetIds.add(attr.enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c);
            }
        }
        product.chargesIds.forEach(chargesId => {this.chargesIds.add(chargesId['enxCPQ__TECH_External_Id__c']),
                                                 this.sourceProductIds.add(chargesId['enxCPQ__TECH_External_Id__c'])});
        this.sourceProductIds.add(product.root.enxCPQ__TECH_External_Id__c);
        product.options.forEach(option => {this.sourceProductIds.add(option.enxCPQ__TECH_External_Id__c)});
        product.provisioningPlanAssings.forEach(prvPlanAssing => {this.provisionigPlansIds.add(prvPlanAssing['enxB2B__Provisioning_Plan__r']['enxB2B__TECH_External_Id__c'])});
    }

    private deleteJsonFields(object: any, firstPropertyToDelete: string, arrayToPush: any, secondPropertyToDelete?: string){
        if(object){
        let cloneObject = {...object};
        delete cloneObject[firstPropertyToDelete];
            if(secondPropertyToDelete){
                delete cloneObject[secondPropertyToDelete];
            }
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
        let pricebookDataToExtract =
        {
            enxCPQ__TECH_External_Id__c: pricebook.enxCPQ__TECH_External_Id__c,
            IsStandard: pricebook.IsStandard
        }
        this.sourcePricebooksIds.push(pricebookDataToExtract);
    

    }
    private extractObjects(objectsArray:any, objectIds:Set<String>, object?: string){
        let result:Array<any> = new Array<any>();
        
        for (let objectId of objectIds) {
            for (let i = 0; i < objectsArray.length; i++) {
                if (object && objectsArray[i][object] && objectsArray[i][object].enxCPQ__TECH_External_Id__c === objectId) {
                    let object:any = objectsArray[i];
                    result.push(object);
                    break;
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
            fs.readFile('./temp/products/' + prodname, function read(err, data) {
                if (err) {
                    reject(err);
                }
                content = data.toString('utf8');
                resolve(JSON.parse(content));
            });
        });
    }
    
    private async extractProduct(conn: core.Connection) {
        let productFileNameList = [];
        // We need to query ID's of records in target org in order to delete or match ID's
        for (let productName of this.productList){
           
            let prdNames = await Util.matchFileNames(productName);
            productFileNameList = [...prdNames];
            let prdAttrsTarget = await Queries.queryProductAttributeIds(conn, productName);                 // for delete                           
            let allStdPricebookEntriesTarget = await Queries.queryStdPricebookEntryIds(conn, productName);  // for delete
            let allPricebookEntriesTarget = await Queries.queryPricebookEntryIds(conn, productName);        // for delete
            
            allStdPricebookEntriesTarget.forEach(stdPbeTarget => {this.stdPricebookEntryIds.push(stdPbeTarget['Id'])})
            allPricebookEntriesTarget.forEach(pbeTarget => {this.pricebookEntryIds.push(pbeTarget['Id'])});
            prdAttrsTarget.forEach(prdAttr => {this.productAttributesIds.push(prdAttr['Id'])});
        }
        // Collect all Ids' of products that will be inserted
        for (let prodname of productFileNameList) {
            const prod = await this.readProduct(prodname);
            this.extractIds(prod);
            this.products.push(prod);
        }
        // Building lists of records to upsert on target org
        for (let product of this.products) {
            delete product['root']['Id'];
            this.productsRoot.push(product['root']);
            this.prdAttributeValues = [...this.prdAttributeValues, ...product['attributeValues']];
            this.productOptions = [...this.productOptions, ...product['options']];
            this.productAttributes = [...this.productAttributes, ...product['productAttributes']];
            this.productRelationships = [ this.productRelationships, ...product['productRelationships']];
            this.attributeDefaultValues = [...this.attributeDefaultValues, ...product['attributeDefaultValues']];
            this.attributeValueDependencies = [...this.attributeValueDependencies, ...product['attributeValueDependencies']];
            this.attributeRules = [...this.attributeRules, ...product['attributeRules']];
            this.provisioningPlanAssignments = [...this.provisioningPlanAssignments, ...product['provisioningPlanAssings']];
        }
    }

    private async extractPricebooks() {
       // reading data for every pricebook
       let dirNames = await Util.readDirNames('temp/pricebooks');
       let allPbes = [];
   
       for(let dirName of dirNames){
           if(dirName=== 'Standard Price Book' ){continue;}                        // <- to jest hardkod!!!
           let pbes = await Util.readAllFiles('temp/pricebooks/' + dirName);
           allPbes.push(pbes);
       }
       
       for(let pbes of allPbes){
           for(let pbe of pbes){
               this.pbes.push(...this.extractObjects(pbe['entries'], this.sourceProductIds, 'Product2'));
               this.pbes.push(...this.extractObjects(pbe['chargeElementPricebookEntries'], this.sourceProductIds, 'Product2'));
           }
       }    
       let stdPbes = await Util.readAllFiles('temp/pricebooks/Standard Price Book');
       stdPbes.forEach(allstdpbe => {this.stdPbes.push(...this.extractObjects(allstdpbe['stdEntries'], this.sourceProductIds, 'Product2'))});
       debugger;
       stdPbes.forEach(allstdpbe => {this.stdPbes.push(...this.extractObjects(allstdpbe['chargeElementStdPricebookEntries'], this.sourceProductIds, 'Product2'))});
    }

    private async extractData(conn: core.Connection) {
        //  Read all other than pricebook and product objects from local store
        const allCategories = await Util.readAllFiles('temp/categories');
        let allCharges = await Util.readAllFiles('temp/charges');
        let allAttributes = await Util.readAllFiles('temp/attributes');
        let allAttributeSets = await Util.readAllFiles('temp/attributeSets');
        let allPricebooks = await Util.readAllFiles('temp/pricebooks');
        let allProvisioningPlans = await Util.readAllFiles('temp/provisioningPlans');
        let allProvisioningTasks = await Util.readAllFiles('/temp/provisioningTasks');     
        let planAssignmentsTarget = await Queries.queryProvisioningPlanAssignmentIds(conn);
        let taskAssignmentsTarget = await Queries.queryProvisioningTaskAssignmentIds(conn);
    
        planAssignmentsTarget.forEach(planAssignmentTarget => {this.provisioningPlanAssignmentIds.push(planAssignmentTarget['Id'])});
        taskAssignmentsTarget.forEach(taskAssignmentTarget => {this.provisioningTaskAssignmentIds.push(taskAssignmentTarget['Id'])});
        let provisioningPlans = [...this.extractObjects(allProvisioningPlans, this.provisionigPlansIds)];
        provisioningPlans.forEach(provisioningPlans => {this.provisioningPlans.push(provisioningPlans['root']),
                                                        this.provisioningTaskAssignments = [...this.provisioningTaskAssignments, ...provisioningPlans['values']]});
        this.provisioningTaskAssignments.forEach(prvTaskAssignment => {this.provisioningTaskIds.add(prvTaskAssignment['enxB2B__Provisioning_Task__r']['enxB2B__TECH_External_Id__c'])})
        this.provisioningTasks.push(...this.extractObjects(allProvisioningTasks, this.provisioningTaskIds));

        allAttributeSets.forEach(attributeSet => {this.attributeSetsRoot.push(attributeSet['root']),
                                                  attributeSet['values'].forEach(attrSetAttr => {this.attributeSetAttributes.push(attrSetAttr)})});
        
        let attributesRoot = [];
        allAttributes.forEach(attr => {attributesRoot.push(attr['root']),
                                       this.attributeValues = [...this.attributeValues, ...attr['values']]});
       
        allPricebooks.forEach(pricebook=>{this.extractPricebookData(pricebook),
                                          this.deleteJsonFields(pricebook, 'Id',  this.pricebooks, 'IsStandard')});
    
        let productCharges = [...this.extractProductObjects(allCharges, this.chargesIds)];
    
        productCharges.forEach(charge=>{this.charges.push(charge['root']);
                                        this.chargeElements = [...this.chargeElements, ...charge['chargeElements']];
                                        this.chargeTiers = [...this.chargeTiers, ...charge['chargeTier']]});  
                                        
        this.chargeElements.forEach(chargeElement => {chargeElement[0] ? this.sourceProductIds.add(chargeElement[0]['enxCPQ__TECH_External_Id__c']): null});
        this.chargeTiers.forEach(chargeTier =>{chargeTier[0] ? this.sourceProductIds.add(chargeTier[0]['enxCPQ__TECH_External_Id__c']) : null});
        this.categories.push(...this.extractProductObjects(allCategories, this.categoryIds));
        this.allCategoriesChild = [...this.categories];
        this.extractParentCategories(this.categories, allCategories);
        this.allCategoriesChild.forEach(category => {delete category['enxCPQ__Parent_Category__r']});
        this.attributes.push(...this.extractProductObjects(attributesRoot, this.attributeIds));
        this.attributeSets.push(...this.extractProductObjects( this.attributeSetsRoot, this.attributeSetIds));
    }
}
