// Class responsible for Importing product data into an org

import {core} from '@salesforce/command';
import * as fs from 'fs';
import { Util } from './Util';
import { RecordResult } from 'jsforce';
import { Queries } from './query';
import { Upsert } from './upsert';

export class ProductImporter {
    private categoryIds:Set<String>;
    private stdPricebookEntryIds:Array<string>;
    private pricebookEntryIds:Array<string>;
    private attributeIds:Set<String>;
    private attributeSetIds:Set<String>;
    private productAttributesIds:Array<string>;
    private sourcePricebooksIds:Array<Object>;
    private sourceProductIds:Array<Object>;
    private targetPricebooksIds:Array<Object>;
    private targetProductIds:Array<Object>;
    private products:Array<Object>;
    private productsRoot:Array<Object>; 
    private categories:Array<Object>;
    private attributes:Array<Object>;
    private attributeSets:Array<Object>;
    private attributeSetAttributes:Array<Object>;
    private attributeSetsRoot:Array<Object>;
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

    constructor(){
        this.products = new Array<Object>();
        this.sourcePricebooksIds = new Array<Object>();
        this.sourceProductIds = new Array<Object>();
        this.targetProductIds = new Array<Object>();
        this.targetPricebooksIds = new Array<Object>();
        this.attributeSetAttributes = new Array<Object>();
        this.categories = new Array<Object>();
        this.attributes = new Array<Object>();
        this.attributeSets = new Array<Object>();
        this.attributeSetsRoot = new Array<Object>();
        this.productsRoot = new Array<Object>();
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
    }
    
    public async all(conn: core.Connection) {       
        
     conn.setMaxListeners(100)   
     let productList = ['testProd_PRD00LAWT3OKNG5'];
     let productNameList = ['testProd']   
     await Upsert.enableTriggers(conn);
     await Upsert.disableTriggers(conn);
     
     // 1. Collect all Ids' of products that will be inserted
     for (let prodname of productList) {
         const prod = await this.readProduct(prodname);
         this.extractIds(prod);
         this.products.push(prod);
     }
     
        // 2. We need to query ID's of records in target org in order to delete or match ID's
     for (let productName of productNameList){
        let prdAttrsTarget = await Queries.queryProductAttributeIds(conn, productName);                 // for delete
        let prdIdsTarget = await Queries.queryProductIds(conn, productName);                            // for matching
        let allStdPricebookEntriesTarget = await Queries.queryStdPricebookEntryIds(conn, productName);  // for delete
        let allPricebookEntriesTarget = await Queries.queryPricebookEntryIds(conn, productName);        // for delete
        
        for(let prdIdTarget of prdIdsTarget){
            let productDataToExtract =
            {
                Id: prdIdTarget['Id'],
                enxCPQ__TECH_External_Id__c: prdIdTarget['enxCPQ__TECH_External_Id__c']
    
            }
        this.targetProductIds.push(productDataToExtract);
        }
        
        for(let stdPricebookEntriesTarget of allStdPricebookEntriesTarget){
            this.stdPricebookEntryIds.push(stdPricebookEntriesTarget['Id']);
        }
        
        for(let pricebookEntriesTarget of allPricebookEntriesTarget){
            this.pricebookEntryIds.push(pricebookEntriesTarget['Id']);
        }
        
        for(let prdAttr of prdAttrsTarget){
            this.productAttributesIds.push(prdAttr['Id']);
        }
    }
        
        // 3. Building lists of records to upsert on target org
    for (let product of this.products) {
        delete product['root']['Id'];
        this.productsRoot.push(product['root']);
        this.attributeValues = [...this.attributeValues, ...product['attributeValues']];
        this.productAttributes = [...this.productAttributes, ...product['productAttributes']];
        this.productRelationships = [...this.productRelationships, ...product['productRelationships']];
        this.attributeDefaultValues = [...this.attributeDefaultValues, ...product['attributeDefaultValues']];
        this.attributeValueDependencies = [...this.attributeValueDependencies, ...product['attributeValueDependencies']];
        this.attributeRules = [...this.attributeRules, ...product['attributeRules']];
        this.provisioningPlanAssignments = [...this.provisioningPlanAssignments, ...product['provisioningPlanAssings']];
    }
    // 4. Read all other objects from local store
    let allCategories = await Util.readAllFiles('temp/categories');
    let allAttributes = await Util.readAllFiles('temp/attributes');
    let allAttributeSets = await Util.readAllFiles('temp/attributeSets');
    let allPricebooks = await Util.readAllFiles('temp/pricebooks');
    let sourceProductIds = await Util.readAllFiles('temp/productIds');
    let allProvisioningPlans = await Util.readAllFiles('temp/provisioningPlans');
    let allProvisioningTasks = await Util.readAllFiles('/temp/provisioningTasks');
    let pricebooksTarget = await Queries.queryPricebooksIds(conn);    

        //TO VERIFY
    let planAssignmentsTarget = await Queries.queryProvisioningPlanAssignmentIds(conn);
    let taskAssignmentsTarget = await Queries.queryProvisioningTaskAssignmentIds(conn);

    for(let planAssignmentTarget of planAssignmentsTarget){
        this.provisioningPlanAssignmentIds.push(planAssignmentTarget['Id']);
    }
    for(let taskAssignmentTarget of taskAssignmentsTarget){
        this.provisioningTaskAssignmentIds.push(taskAssignmentTarget['Id']);
    }
    for(let provisioningTask of allProvisioningTasks){
        this.provisioningTasks.push(provisioningTask);
    }
    for(let provisioningPlans of allProvisioningPlans){
        this.provisioningPlans.push(provisioningPlans['root']);
        this.provisioningTaskAssignments.push(provisioningPlans['values']);
    }    
       // TO VERIFY
    for(let sourceProductId of sourceProductIds){
        this.sourceProductIds.push(sourceProductId);
        }
     for(let category of allCategories){
         this.deleteJsonFields(category, 'enxCPQ__Parent_Category__r', this.allCategoriesChild);
     }
     
     for(let attributeSet of allAttributeSets){
         this.attributeSetsRoot.push(attributeSet['root']);
         for(let attrSetAttr of attributeSet['values'])
         this.attributeSetAttributes.push(attrSetAttr);
     }
     
     let attributesRoot = [];
     for(let attr of allAttributes){
         attributesRoot.push(attr['root']);
     }
    //5 reading data for every pricebook
    let dirNames = await Util.readDirNames('temp/pricebooks');
    let allPbes = [];
    for(let dirName of dirNames){
        if(dirName=== 'Standard Price Book' ){continue;}                        // <- to jest hardkod!!!
        let pbes = await Util.readAllFiles('temp/pricebooks/' + dirName);
        allPbes.push(pbes);
    }
    
    for(let pbes of allPbes){
        for(let pbe of pbes){
            for(let pbeEntry of pbe['entries'])
            this.pbes.push(pbeEntry);
        }
    }    
    let stdPbes = await Util.readAllFiles('temp/pricebooks/Standard Price Book');
    for(let allstdpbe of stdPbes){
        for(let stdpbe of allstdpbe['stdEntries']){
          this.stdPbes.push(stdpbe);
        }
    }
    
    
    for(let pricebookTarget of pricebooksTarget){
        
        let pricebookDataToExtract =
        {
            Id: pricebookTarget['Id'],
            enxCPQ__TECH_External_Id__c: pricebookTarget['enxCPQ__TECH_External_Id__c'],
            IsStandard: pricebookTarget['IsStandard']
        }    
        this.targetPricebooksIds.push(pricebookDataToExtract);
    }
    
    for(let pricebook of allPricebooks){
        this.extractPricebookData(pricebook);
        this.deleteJsonFields(pricebook, 'Id',  this.pricebooks, 'IsStandard');
    }
    

    this.categories.push(...this.extractObjects(allCategories, this.categoryIds));
    this.attributes.push(...this.extractObjects(attributesRoot, this.attributeIds));
    this.attributeSets.push(...this.extractObjects( this.attributeSetsRoot, this.attributeSetIds));

    console.log('products to upsert: ' + this.products.length);
    console.log('categories to upsert: ' + this.categories.length);
    console.log('attributes to upsert: ' + this.attributes.length);      
    console.log('attributeSets to upsert: ' + this.attributeSets.length);      
   
    //6.Perform an upsert of data
    try {
        await this.upsertBulkObject(conn, 'enxCPQ__Category__c', this.allCategoriesChild);
        await this.upsertBulkObject(conn, 'enxCPQ__Category__c', this.categories);
        await this.upsertBulkObject(conn, 'enxCPQ__Attribute__c', this.attributes);
        await this.upsertBulkObject(conn, 'enxCPQ__AttributeSet__c', this.attributeSetsRoot);
        await this.upsertBulkObject(conn, 'Product2', this.productsRoot);
        await this.upsertBulkObject(conn, 'enxCPQ__AttributeValue__c', this.attributeValues);
        await this.upsertBulkObject(conn, 'enxCPQ__AttributeSetAttribute__c', this.attributeSetAttributes);
        await this.deleteBulkObject(conn, 'enxCPQ__ProductAttribute__c', this.productAttributesIds);
        await this.upsertBulkObject(conn, 'enxCPQ__ProductAttribute__c', this.productAttributes)
        let pricebooks = this.pricebooks.filter(pricebook => pricebook['Name'] !== 'Standard Price Book');
        await this.upsertBulkObject(conn, 'Pricebook2', pricebooks);
        
        
        Upsert.mapPricebooks(this.sourcePricebooksIds,  this.targetPricebooksIds);
        Upsert.mapProducts(this.sourceProductIds[0], this.targetProductIds);
       
        await this.deleteBulkObject(conn, 'PricebookEntry', this.pricebookEntryIds);
        await this.deleteBulkObject(conn, 'PricebookEntry', this.stdPricebookEntryIds);
        for(let stdPbe of this.stdPbes){
            delete stdPbe['Pricebook2'],
            delete stdPbe['Product2']
        }
        await Upsert.upsertBulkPricebookEntries(conn, this.stdPbes);
        
        
        this.pbes.forEach(pbe=> {
            delete pbe['Pricebook2'],
            delete pbe['Product2']
        });
        await Upsert.upsertBulkPricebookEntries(conn, this.pbes)
        
        
        
        await this.upsertBulkObject(conn, 'enxCPQ__ProductRelationship__c', this.productRelationships);
        await this.upsertBulkObject(conn, 'enxCPQ__AttributeDefaultValue__c', this.productRelationships);
        await this.upsertBulkObject(conn, 'enxCPQ__AttributeValueDependency__c', this.attributeValueDependencies);
        await this.upsertBulkObject(conn, 'enxCPQ__AttributeRule__c', this.attributeRules);
        await this.upsertBulkObject(conn, 'enxB2B__ProvisioningPlan__c', this.provisioningPlans);
        await this.upsertBulkObject(conn, 'enxB2B__ProvisioningTask__c', this.provisioningTasks)
      
        await this.deleteBulkObject(conn, 'enxB2B__ProvisioningPlanAssignment__c', this.provisioningPlanAssignmentIds);
        await this.deleteBulkObject(conn, 'enxB2B__ProvisioningTaskAssignment__c', this.provisioningTaskAssignmentIds);
       
        await Upsert.insertObject(conn, 'enxB2B__ProvisioningPlanAssignment__c', this.provisioningPlanAssignments);
        await Upsert.insertObject(conn, 'enxB2B__ProvisioningTaskAssignment__c', this.provisioningTaskAssignments);
        await Upsert.enableTriggers(conn);
    } catch (ex) {
    Util.log(ex);
    }
    
} 



private extractIds(product:any) {
    if(product.root.enxCPQ__Category__r){
        this.categoryIds.add(product.root.enxCPQ__Category__r.enxCPQ__TECH_External_Id__c);
    }
        if (product.productAttributes != null) {
            for (let attr of product.productAttributes) {
                this.attributeIds.add(attr.enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c);
                if (attr['enxCPQ__Attribute_Set__r'] != undefined) {
                    this.attributeSetIds.add(attr.enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c);
                }
            }
        }
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
    
    private extractObjects(objectsArray:any, objectIds:Set<String>) {
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
            Id: pricebook.Id,
            enxCPQ__TECH_External_Id__c: pricebook.enxCPQ__TECH_External_Id__c,
            IsStandard: pricebook.IsStandard
        }
        this.sourcePricebooksIds.push(pricebookDataToExtract);
    

    }
    
    private async readProduct(prodname:String) {
        let content;
        return new Promise<string>((resolve: Function, reject: Function) => {
            fs.readFile('./temp/products/' + prodname +'.json', function read(err, data) {
                if (err) {
                    reject(err);
                }
                content = data.toString('utf8');
                resolve(JSON.parse(content));
            });
        });
    }  
    
    private async upsertBulkObject(conn: core.Connection, sObjectName: string, data: Object[]): Promise<string> {
        if(data.length===0){
           return;
        }
        if(sObjectName === 'enxB2B__ProvisioningPlanAssignment__c'){
            Util.log(data);
        }
        Util.log('--- importing ' + sObjectName + ': ' + data.length + ' records');
        let b2bNames = ['enxB2B__ProvisioningPlan__c','enxB2B__ProvisioningTask__c','enxB2B__ProvisioningPlanAssignment__c', 'enxB2B__ProvisioningTaskAssignment__c'];
        let techId = b2bNames.includes(sObjectName)  ? 'enxB2B__TECH_External_Id__c' : 'enxCPQ__TECH_External_Id__c';
        Util.sanitizeForImport(data);

        let promises:Array<Promise<RecordResult>> = new Array<Promise<RecordResult>>();
        for (const record of data) {
        promises.push(conn.sobject(sObjectName).upsert(record, techId, {}, function(err: any, rets: RecordResult) {
            if (err) {
                Util.log('error creating ' + sObjectName + ': ' + err);
                return;
            }   
        }));
        }
        await Promise.all(promises);
    }

    private async deleteBulkObject(conn: core.Connection, sObjectName: string, data: string[]): Promise<string> {
        if(data.length===0){
            return;
         }
        Util.log('--- deleting ' + sObjectName + ': ' + data.length + ' records');
        let promises:Array<Promise<RecordResult>> = new Array<Promise<RecordResult>>();
        for (const record of data) {
            promises.push(conn.sobject(sObjectName).del(record, function(err: any, rets) {
                if (err) {
                    Util.log('error creating ' + sObjectName + ': ' + err);
                    return;
                }   
            }));
        }
        await Promise.all(promises);
    };      
    }
