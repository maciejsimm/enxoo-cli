// Class collecting all utilities 

import { core, UX } from "@salesforce/command";
import * as fs from 'fs';
import * as fsExtra from 'fs-extra'
import { Connection } from 'jsforce';
import * as _ from 'lodash';
import {Query} from  '../entity/queryEntity';
export class Util {

    public static OBJECT_MISSING_TECH_ID_ERROR: string = 'Object is missing TECH_External_Id__c field value';
    
    private static dir: string;

    public static getObjectsMissingTechId(objectArray: Array<any>): Array<any>{
        return objectArray 
            ? objectArray.filter(object => (
                !(object.enxCPQ__TECH_External_Id__c || object.enxB2B__TECH_External_Id__c || object.enxB2B__TECH_External_ID__c)
            ))
            : [];
    }

    public static removeIdFields(objectArray: Array<any>): void{
        if(!objectArray){
            return;
        }
        
        objectArray.forEach(object => {
            if(Object.keys(object).includes('Id')){
                delete object.Id;
            }
        });
    }

    public static setDir(dir: string){
        this.dir = dir;
    }
    
	public static throwError(msg: any) {
		throw new core.SfdxError(msg, "Error", null, -1);
    }
    
    public static showSpinner(msg: any) {
        UX.create()
            .then((ux) => {
                ux.startSpinner(msg);
            })    
    }

    public static hideSpinner(msg: any) {
        UX.create()
            .then((ux) => {
                ux.stopSpinner(msg);
            })
    }

    public static log(msg: any) {
        UX.create()
            .then((ux) => {
                ux.log(msg);
            })
    }

    public static setToIdString(aSet: Set<any>):String {
        let result = '';
        if (aSet.size === 0 || aSet === null || aSet === undefined) return "''";
        for (let elem of aSet) {
            result += "'" + elem + "',";
        }
        result = result.substring(0, result.length - 1);
        return result;
    }

    public static sanitizeJSON(obj: any) {
        let isArray = obj instanceof Array;
        let isString = (typeof obj == 'string');
        let isObject = (typeof obj == 'object' && !isArray && !isString);

        if (isArray) {
            for (let subObj of obj) {
                this.sanitizeJSON(subObj);
            }
        }

        if (isObject) {
            
            for (let prop in obj) {
                if ( obj[prop] == "true")  obj[prop] = true;
                if ( obj[prop] == "false")  obj[prop] = false;
                if (prop === 'attributes') {
                    delete obj[prop];
                    continue;
                }
                this.sanitizeJSON(obj[prop]);
            }
        }
        return obj;
    }

    public static sanitizeForUpsert(obj: any) {
        let isArray = obj instanceof Array;
        let isString = (typeof obj == 'string');
        let isObject = (typeof obj == 'object' && !isArray && !isString);

        if (isArray) {
            for (let subObj of obj) {
                this.sanitizeForUpsert(subObj);
            }
        }

        if (isObject) {
            for (let prop in obj) {
                if (prop === 'attributes') {
                    delete obj[prop];
                    continue;
                }

                if (prop.indexOf('__r') !== -1 && obj[prop] == null) delete obj[prop];

                if (typeof(obj[prop]) === 'object') {
                    for (let innerProp in obj[prop]) {
                        if (innerProp === 'attributes') delete obj[prop][innerProp];
                    }
                }
            }
        }
    }

    public static sanitizeForInsert (arr:any, sObjectName:string)  {
      
        for (let i = 0; i < arr.length; i++) {
            for (let prop in arr[i]) {
                if (prop === 'attributes') delete arr[i][prop];    
                if ((prop ==='Pricebook2' || prop ==='Product2') && arr[i][prop] == null){
                    arr[i][prop] ={}; 
                    arr[i][prop]['enxCPQ__TECH_External_Id__c'] = null;
                }
                if (prop.indexOf('__r') && arr[i][prop] == null && (arr.length > 80 || sObjectName === 'enxCPQ__AttributeValue__c')){
                     arr[i][prop] =""; 
                } 
                else if (prop.indexOf('__r') && arr[i][prop] == null && prop!== 'enxCPQ__TECH_External_Id__c') delete arr[i][prop];       
                if (typeof(arr[i][prop]) === 'object') {
                    for (let innerProp in arr[i][prop]) {
                        if (innerProp === 'attributes') delete arr[i][prop][innerProp];
                    }
                }
            }
        }
    }

    public static async readFile(directoryName: String, fileName: String) {
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            let content;
            fs.readFile('./'+this.dir + directoryName + '/' + fileName, function read(err, data) {
                if (err) {
                    reject(err);
                }
                content = data.toString('utf8');
                resolve(JSON.parse(content));
            });
        });
    }

    public static async readAllFiles(directoryName: String, currencies?: Set<String>) {
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            let allFilePromiseArray = new Array<any>();
            fs.readdir('./' + this.dir + directoryName + '/', async (err, filenames) => {
                if (err) {
                    throw err;
                }
                if(currencies){
                    allFilePromiseArray= filenames.filter(fileName => fileName.includes('.json'))
                                                  .filter(fileName => currencies.has(fileName.replace('.json','')))
                                                  .map(async fileName =>  this.readFile(directoryName, fileName));
                     
                }else{
                    allFilePromiseArray= filenames.filter(fileName => fileName.includes('.json'))
                                                  .map(async fileName =>  this.readFile(directoryName, fileName));
                }
                await Promise.all(allFilePromiseArray).then((allFileContents) => {
                    resolve(allFileContents);
                })
            })
        });            
    }
    

    public static async readDirNames(directoryName: String){
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            fs.readdir('./' + this.dir + directoryName + '/', async (err, filenames) => {
                if (err) {
                    throw err;
                }
                let fileNamesToResolve = filenames.filter(fileName => !fileName.includes('.json'));
                
                resolve(fileNamesToResolve);
                });
            });            
    }

    public static async matchFileNames(productName: string){
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            fs.readdir('./' + this.dir +'/products/' , async (err, filenames) => {
                let fileNamesToResolve = filenames.filter(fileName => fileName.startsWith(this.sanitizeFileName(productName)));
                if(!fileNamesToResolve[0] || err){
                    reject('Failed to find Product:'+ productName + err);
                }
                resolve(fileNamesToResolve);
            });   
        });            
    }
    public static async retrieveAllFileName(){
        let allProducts = await this.readAllFiles('/products');
        let allProductsNames = new Set<string>();

        allProducts.forEach(product => allProductsNames.add(product['root']['Name']));
        Util.log('retrieved: ' + allProductsNames.size + ' file names')
        return allProductsNames;
    }

    public static async writeFile(path:string, dataToSanitaze:any){
        await fs.writeFile('./' + this.dir + path, JSON.stringify(Util.sanitizeJSON(dataToSanitaze), null, 3), function(err) {
            if(err) {
                return Util.log(err);
            }
        });
    }

    public static createDir(dir:string){
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    public static createAllDirs(isB2B: boolean, dir: string){
        const dirs = ['/products', '/categories', '/attributes', 
                     '/attributeSets', '/priceBooks', '/charges', '/bundleElements'];
        const dirsToCreate = dirs.map(singleDir => './' + dir + singleDir);
        if(isB2B){
            dirsToCreate.push('./'+dir+'/provisioningPlans', './'+dir+'/provisioningTasks');
        }
        dirsToCreate.forEach(dir => { this.createDir(dir) })
    }

    public static removeB2BFields(object: any){
        delete object['enxB2B__MRC_List__c'];
        delete object['enxB2B__OTC_List__c'];
        delete object['enxB2B__Service_Capex__c'];
    }

    public static removeDir(dir: string){
        fsExtra.remove('./' + dir, err => {
             Util.log(err);
         });
    }

    public static sanitizeFileName(fileName: string){
        if(fileName){
            return fileName.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'_');
        }
        return fileName;
    }

    public static isBulkApi(objectToCheck: String[]){
        if(!objectToCheck || objectToCheck[0] !== 'useBulkApi'){
            return false;
        }
        return true;
    }

    public static sanitizeResult(result: any){
        for(let props of result){
            for(let prop in props){
                if(prop.includes('.')){
                    let separatedProp = prop.split('.');
                    props[separatedProp[0]] = {};
                    if(props[prop]){
                        props[separatedProp[0]][separatedProp[1]] = props[prop];
                    } else{
                        props[separatedProp[0]] = null;
                    }
                    delete props[prop];
                }
            }
        }
    }

    public static sanitizeForBulkImport(objs: any){

        for(let obj of objs){
 
            for(let prop in obj){
                if(typeof obj[prop] == 'object'){
                    let newProp;
                    for(let innerProp in obj[prop]){
                        newProp = prop +'.'+innerProp;
                        obj[newProp] = obj[prop][innerProp] != null ? obj[prop][innerProp] : "";
                    }
                    delete obj[prop];
                }
           }
        }

        for(let i=0; i<objs.length-1; i++ ){
            for(let prop in objs[i]){
                if(prop === 'enxCPQ__TECH_External_Id__c' || prop ==='enxB2B_TECH_External_Id__c' || prop ==='enxB2B__TECH_External_ID__c' || prop ==='Id'){
                    continue;
                }
                if( objs[i][prop] !=null  && objs[i+1][prop] == null ){
                    objs[i+1][prop] = '';
                }     
            }
        }
        for(let i=objs.length-1; i>0; i-- ){
            for(let prop in objs[i]){
                if(prop === 'enxCPQ__TECH_External_Id__c' || prop ==='enxB2B_TECH_External_Id__c' || prop ==='enxB2B__TECH_External_ID__c' || prop ==='Id'){
                    continue;
                }
                if( objs[i][prop] !=null  && objs[i-1][prop] ==null ){
                    objs[i-1][prop] = '';
                }    
            }
        }
    }

    public static convertFlatObjectToNestedObject(flatObject: any){
        return Object.entries(flatObject)
        .reduce((nestedObject, [field, value]) => Util.createPropertyTree(nestedObject, field.split('.'), value), {})
    }
    
    private static createPropertyTree (targetObject: any, fieldsStructure: string[], value: any) {
        const [firstField, ...rest] = fieldsStructure;
        const mainProperty = targetObject ? targetObject : {};
        if(rest.length === 0) {
          return { ...mainProperty, [firstField]: value };
        }
        return { 
          ...mainProperty, 
          [firstField]: Util.createPropertyTree(mainProperty[firstField], rest, value)
        };
    }

    public static async readQueryJson(queryDir: string){
        return new Promise<String>((resolve: Function, reject: Function) => {
        let content;
        fs.readFile('./' +queryDir+ '/queryConfiguration.json', function read(err, data) {
            if (err) {
                reject(err);
            }
            content = data.toString('utf8');
            resolve(JSON.parse(content));
        });
    });
}

    public static async createQueryPromiseArray(query: Query, connection: Connection, secondaryQuery?: Query): Promise<String[]>{
        Util.log('---Bulk exporting ' + query.sobjectName +' in promise Array- this might take a while');
        let firstPromises:Array<Promise<String[]>> = new Array<Promise<String[]>>();
        let firstListArray = Array.from(query.objectsList.values());
        let firstListChunkes = _.chunk(firstListArray, 90);

        let secondListArray;
        let secondListChunkes
        if(secondaryQuery){
            secondListArray = Array.from(secondaryQuery.objectsList.values());
            secondListChunkes = _.chunk(secondListArray, 90);
        }
       firstPromises = firstListChunkes.map(fList =>{
            let fSet = new Set(fList);
            let finalQuery = query.queryBegining +  Util.setToIdString(fSet) + query.queryConditions;
            return this.createBulkQuery(connection, finalQuery, query.sobjectName);
       });

        return new  Promise<String[]>(async(resolve: Function, reject: Function) => {
            await Promise.all(firstPromises).then(async firstResults =>{
                let records = [];
                for(let firstResult of firstResults){
                    records= [...records,...firstResult];
                } 
                if(!secondaryQuery){
                    Util.log('exported ' +Array.from(new Set(records)).length +' records of ' +query.sobjectName)
                    resolve (Array.from(new Set(records)));
                }else{
                    let secondPromises:Array<Promise<String[]>> = new Array<Promise<String[]>>();
                    secondPromises = secondListChunkes.map(sList =>{
                        let sSet = new Set(sList);
                        let finalQuery = query.queryBegining +  Util.setToIdString(sSet) + query.queryConditions;
                        return this.createBulkQuery(connection, finalQuery, secondaryQuery.sobjectName)
                   });
                    await Promise.all(secondPromises).then(async secondResults =>{
                        for(let secondResult of secondResults){
                            records= [...records,...secondResult];
                        } 
                        Util.log('exported ' +Array.from(new Set(records)).length +' records of ' +secondaryQuery.sobjectName)
                        resolve (Array.from(new Set(records)));
                 });
              }
        });
       });
     }

    public static async createBulkQuery(conn:Connection, query:string, sobjectName: string): Promise<String[]>{
        return new  Promise<String[]>((resolve: Function, reject: Function) => {
        let records = []; 
       
        conn.bulk.query(query)
            .on('record', function(rec) { 
                records.push(rec);
            })
            .on('error', function(err) { 
                reject('error retrieving '+sobjectName +' ' + err);  
            })
            .on('end', function(info) { 
                Util.hideSpinner(sobjectName +' export done. Retrieved: '+ records.length);
                resolve(records.map(record => (
                    Util.convertFlatObjectToNestedObject(record)
                ))); 
            });
        })
    }
    public static async readProduct(prodname:String) {
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

    public static async  retrieveRelatedProductsNames(productFileNameList: Set<String>){
        let secondaryProductsTechIds=[];
        for (let prodname of productFileNameList) {
            const prod = await this.readProduct(prodname);
            if(prod['productRelationships']) {
                secondaryProductsTechIds = prod['productRelationships'].map(productRelationship => productRelationship['enxCPQ__Secondary_Product__r']['enxCPQ__TECH_External_Id__c']);
            }
        }
        let allProducts = await this.readAllFiles('/products');
        let secondaryProductsNames = new Set<string>();

        for(let secondaryProductsTechId of secondaryProductsTechIds){

            allProducts.filter(product => product['root']['enxCPQ__TECH_External_Id__c']===secondaryProductsTechId)
                       .forEach(product => secondaryProductsNames.add(product['root']['Name']));
        }
        
        return secondaryProductsNames;
    }

    private static getBundleElementOptionProductTechId(bundleElementOption): string{
        if(!bundleElementOption['enxCPQ__Product__r']){
            return null;
        }

        const rootProduct = bundleElementOption['enxCPQ__Product__r'] && bundleElementOption['enxCPQ__Product__r']['enxCPQ__Root_Product__r'];
        if(rootProduct){
            return rootProduct['enxCPQ__TECH_External_Id__c'];
        }

        return bundleElementOption['enxCPQ__Product__r']['enxCPQ__TECH_External_Id__c'];
    }

    private static retrieveBundleElementOptionProductsTechIds(allBundleElements: Array<any>, rootProductsTechIds: Set<string>): Set<string>{
        const additionalBundleElements = allBundleElements.filter(bundleElement => (
            rootProductsTechIds.has(bundleElement['root']['enxCPQ__Bundle__r']['enxCPQ__TECH_External_Id__c'])
        ));
        const additionalOptions = additionalBundleElements.reduce((optionsList, bundleElement) => (
            [...optionsList, ...bundleElement['bundleElementOptions']]
        ), []);

        return new Set(additionalOptions.map(this.getBundleElementOptionProductTechId));
    }

    public static async retrieveBundleElementOptionProductsNames(productFileNames: Set<String>){
        let rootProductsTechIds = await Promise.all([...productFileNames].map(async productFileName => {
            const product = await this.readProduct(productFileName);
            return product['root']['enxCPQ__TECH_External_Id__c'];
        }));

        const allBundleElements = await this.readAllFiles('/bundleElements');

        let additionalProductsTechIds = this.retrieveBundleElementOptionProductsTechIds(allBundleElements, new Set(rootProductsTechIds));
        let shouldSearchforAdditionalProducts = true;

        while(shouldSearchforAdditionalProducts){
            const newProductsTechIds = this.getSetsDifference(
                this.retrieveBundleElementOptionProductsTechIds(allBundleElements, additionalProductsTechIds),
                additionalProductsTechIds
            );

            if(newProductsTechIds.size > 0){
                additionalProductsTechIds = new Set([...additionalProductsTechIds, ...newProductsTechIds]);
            } else {
                shouldSearchforAdditionalProducts = false;
            }
        }
        
        const allProducts = await this.readAllFiles('/products');
        const additionalRootProductsNames = allProducts
        .filter(product => {
            const isPrdOptionRelatedToBundleElOption = product['options'].some(productOption => (
                additionalProductsTechIds.has(productOption['enxCPQ__TECH_External_Id__c'])
            ));
            const isProductRelatedToBundleElOption = additionalProductsTechIds.has(product['root']['enxCPQ__TECH_External_Id__c']);
            return isPrdOptionRelatedToBundleElOption || isProductRelatedToBundleElOption;
        })
        .map(product => product['root']['Name']);

        return additionalRootProductsNames;
    }

    public static async  retrieveRelatedProductsFileNames(productFileNameList: Set<String>){
        let secondaryProductsNames = await this.retrieveRelatedProductsNames(productFileNameList);
        let secondaryProductsFileNames = new Set<String>();
        
        for (let productName of secondaryProductsNames){
            let prdNames = await Util.matchFileNames(productName);
            secondaryProductsFileNames = new Set([...secondaryProductsFileNames, ...prdNames]);
        }
        return secondaryProductsFileNames;
    }
    
    public static extractIdsOfPbeToUpdate(pricebookEntriesTarget: Array<any>){
        let idsOfPbeToUpdate = pricebookEntriesTarget.map(pbe => pbe.Product2.enxCPQ__TECH_External_Id__c)
        let result = new Set<String>([...idsOfPbeToUpdate])
        return result;
    }

    public static getSetsDifference(set1: Set<string>, set2: Set<string>): Set<string>{
        return new Set([...set1].filter(element => (
           !set2.has(element) 
        )));
    }

    public static constructFileName(object: any){
        let objectName = object['Name'];
        let objectTechId = object['enxCPQ__TECH_External_Id__c'];
        return objectName + objectTechId;
    }

    public static convert2DTo1DArray(twoDimensionalArray: Array<Array<any>>): Array<any>{
        return twoDimensionalArray.reduce((resultArray,current2DArrayElement) => (
            [...resultArray, ...current2DArrayElement]
        ), []);
    }
}