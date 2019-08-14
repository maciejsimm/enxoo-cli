// Class responsible for Importing product data into an org

import { Connection } from '@salesforce/core';
import * as fs from 'fs';
import { Util } from './Util';
import { RecordResult } from 'jsforce';
import { Queries } from './query';
var upsert = require('./upsert');

export class ProductImporter {

    private categoryIds:Set<String>;
    private attributeIds:Set<String>;
    private attributeSetIds:Set<String>;
    
    private products:Array<any>;
    private productsRoot:Array<any>; 
    private categories:Array<any>;
    private parentCategories:Array<any>;
    private attributes:Array<any>;
    private attributeSets:Array<any>;
    private attributeValues:Array<any>;

    public async all(conn: Connection) {       
        
        conn.setMaxListeners(100);
        
        this.categoryIds = new Set<String>();
        this.attributeIds = new Set<String>();
        this.attributeSetIds = new Set<String>();
        
        this.products = new Array<Object>();
        this.categories = new Array<Object>();
        this.parentCategories = new Array<Object>();
        this.attributes = new Array<Object>();
        this.attributeSets = new Array<Object>();
        this.productsRoot = new Array<Object>();
        this.attributeValues = new Array<Object>();
        let productList = ['[x] Internet Access_PRD00INTACCESS'];
    

        
        for (let prodname of productList) {
            const prod = await this.readProduct(prodname);
            this.extractIds(prod);
            this.products.push(prod);
        }
        
        this.products.forEach( product => {this.productsRoot.push(product.root)});
        this.products.forEach( product => {this.attributeValues.push(product.attributeValues)});


        let recordTypesSource = await Util.readAllFiles('temp/recordTypes');
        const recordTypesTarget = await Queries.queryRecordTypes(conn);
        upsert.mapRecordTypes(recordTypesSource, recordTypesTarget);
        

        let allCategories = await Util.readAllFiles('temp/categories');
        let allAttributes = await Util.readAllFiles('temp/attributes');
        let allParentCategories = await Util.readAllFiles('temp/parentCategories');
        
        for(let parentCategory of allParentCategories){
            this.parentCategories.push(parentCategory);
        }

       // console.log(allAttributes)
        let allAttributeSets = await Util.readAllFiles('temp/attributeSets');
     
        this.categories.push(...this.extractObjects(allCategories, this.categoryIds));
        this.attributes.push(...this.extractObjects(allAttributes, this.attributeIds));
        this.attributeSets.push(...this.extractObjects(allAttributeSets, this.attributeSetIds));
        
        console.log('products to upsert: ' + this.products.length);
        console.log('categories to upsert: ' + this.categories.length);
        console.log('attributeSets to upsert: ' + this.attributeSets.length);

        await this.upsertBulkObject(conn, 'enxCPQ__Category__c', this.parentCategories);

       await this.upsertBulkObject(conn, 'enxCPQ__Category__c', this.categories);
       await this.upsertBulkObject(conn, 'enxCPQ__Attribute__c', this.attributes);
       await this.upsertBulkObject(conn, 'enxCPQ__AttributeSet__c', this.attributeSets);
       await this.upsertBulkObject(conn, 'Product2', this.productsRoot);
       
       this.attributeValues.forEach( attributeValue=>  {this.upsertBulkObjectAwait(conn, 'enxCPQ__AttributeValue__c', attributeValue)});
    } 
    
    private extractIds(product:any) {
        this.categoryIds.add(product.root.enxCPQ__Category__r.enxCPQ__TECH_External_Id__c);
        if (product.productAttributes != null) {
            for (let attr of product.productAttributes) {
                this.attributeIds.add(attr.enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c);
                if (attr['enxCPQ__Attribute_Set__r'] != undefined) {
                    this.attributeSetIds.add(attr.enxCPQ__Attribute_Set__r.enxCPQ__TECH_External_Id__c);
                }
            }
        }
    }
    
    private extractObjects(objectsArray:any, objectIds:Set<String>) {
        let result:Array<any> = new Array<any>();
        let objectIdsArr = Array.from(objectIds.values());
        
        for (let j = 0; j < objectIdsArr.length; j++) {
            for (let i = 0; i < objectsArray.length; i++) {
                if (objectsArray[i]['enxCPQ__TECH_External_Id__c'] === objectIdsArr[j]) {
                    let test:any = objectsArray[i];
                    result.push(test);
                    break;
                }
            }
        }
        // console.log('extract res len-'+ result.length);
        return result;
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
    private async upsertBulkObjectAwait(conn: Connection, sObjectName: string, data: Object[]) {
        await this.upsertBulkObject(conn, sObjectName, data) 
    }

    private async upsertBulkObject(conn: Connection, sObjectName: string, data: Object[]): Promise<string> {
        Util.showSpinner('--- importing ' + sObjectName + ': ' + data.length + ' records');
        Util.sanitizeForImport(data);
        return new Promise<string>((resolve: Function, reject: Function) => {
            conn.sobject(sObjectName).upsert(data, "enxCPQ__TECH_External_Id__c", {}, function(err: any, rets: RecordResult) {
                if (err) {
                    reject('error creating ' + sObjectName + ': ' + err);
                    return;
                }
                //let errorsCount = 0;
                // for (let i = 0; i < rets.length; i++) {
                //     if (!rets[i].success) {
                //         console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                //         errorsCount++;
                //     }
                // }
               // console.log("--- upserted categories: " + rets.length + ", errors: " + errorsCount);
                resolve('OK');
            });
            // conn.bulk.load(sObjectName, 'upsert', {'extIdField': 'enxCPQ__TECH_External_Id__c'}, data, async (err:any, rets:RecordResult[]) => {
            //     if (err) {
            //         console.log(err);
            //         reject('error creating ' + sObjectName + ': ' + err);
            //         return;
            //     }
                
            //     let successCount = rets
            //                     .map((elem:RecordResult):number => { return (elem.success ? 1 : 0) })
            //                     .reduce((prevVal:number, nextVal:number) => { return (prevVal + nextVal) });

            //     await Util.hideSpinner(' Done. Success: ' + successCount + ', Errors: ' + (data.length - successCount)); 
            //     rets.forEach(async (ret, i) => {
            //         if (ret.success === false) {
            //             await Util.log('----- ['+ i +'] errors: ' + ret.errors);
            //         } 
            //     })

            //     resolve('OK');
            // });
        });
    }

    // private async upsertObject(conn: Connection, sObjectName: string, data: Object[]): Promise<string> {
    //     Util.log('--- importing ' + sObjectName + ' records. Count: ' + data.length);
    //     Util.sanitizeForImport(data);
    //     return new Promise<string>((resolve: Function, reject: Function) => {
    //         conn.sobject(sObjectName).upsert(data, 'enxCPQ__TECH_External_Id__c', (err:any, rets:RecordResult[]) => {
    //             if (err) {
    //                 console.log(err);
    //                 reject('error creating ' + sObjectName + ': ' + err);
    //                 return;
    //             }
    //             console.log(rets);
    //             let successCount = rets
    //                             .map((elem:RecordResult):number => { return (elem.success ? 1 : 0) })
    //                             .reduce((prevVal:number, nextVal:number) => { return (prevVal + nextVal) });

    //             Util.log('----- upserted ' + successCount + ', errors: ' + (data.length - successCount));
    //             resolve('OK');
    //         });
    //     });
    // }

}