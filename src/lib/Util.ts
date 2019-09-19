// Class collecting all utilities 

import { core, UX } from "@salesforce/command";
import * as fs from 'fs';
import * as fsExtra from 'fs-extra'

export class Util {

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

    public static setToIdString(aSet: Set<String>):String {
        let result = '';
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
                if (prop === 'attributes') {
                    delete obj[prop];
                    continue;
                }
                this.sanitizeJSON(obj[prop]);
            }
        }
        return obj;
    }

    public static sanitizeForImport(obj: any) {
        let isArray = obj instanceof Array;
        let isString = (typeof obj == 'string');
        let isObject = (typeof obj == 'object' && !isArray && !isString);

        if (isArray) {
            for (let subObj of obj) {
                this.sanitizeForImport(subObj);
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

    public static async readFile(directoryName: String, fileName: String) {
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            let content;
            fs.readFile('./' + directoryName + '/' + fileName, function read(err, data) {
                if (err) {
                    reject(err);
                }
                content = data.toString('utf8');
                resolve(JSON.parse(content));
            });
        });
    }

    public static async readAllFiles(directoryName: String) {
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            let allFilePromiseArray = new Array<any>();

            fs.readdir('./' + directoryName + '/', async (err, filenames) => {
                if (err) {
                    throw err;
                }
                   filenames.filter(fileName => fileName.includes('.json')).forEach(async (fileName) => {
                    const fileReadPromise = Util.readFile(directoryName, fileName)
                    allFilePromiseArray.push(fileReadPromise);
                });
                await Promise.all(allFilePromiseArray).then((allFileContents) => {
                    resolve(allFileContents);
                })
                
            });            
        });
    }

    public static async readDirNames(directoryName: String){
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            fs.readdir('./' + directoryName + '/', async (err, filenames) => {
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
            fs.readdir('./temp/products/' , async (err, filenames) => {
                let fileNamesToResolve = filenames.filter(fileName => fileName.startsWith(productName));
                if(!fileNamesToResolve[0] || err){
                    reject('Failed to find Product:'+ productName + err);
                }
                resolve(fileNamesToResolve);
                });   
            });            
        }

    public static async writeFile(path:string, dataToSanitaze:any){
        await fs.writeFile(path, JSON.stringify(Util.sanitizeJSON(dataToSanitaze), null, 3), function(err) {
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
    public static createAllDirs(isB2B: boolean){
        const dirs = ['./temp/products', './temp/categories', './temp/attributes', 
                     './temp/attributeSets', './temp/priceBooks', './temp/charges' ];
        if(isB2B){
            dirs.push('./temp/provisioningPlans', './temp/provisioningTasks');
        }
        dirs.forEach(dir => { this.createDir(dir) })
    }
    public static removeB2BFields(object: any){
        delete object['enxB2B__MRC_List__c'];
        delete object['enxB2B__OTC_List__c'];
        delete object['enxB2B__Service_Capex__c'];
    }
    public static removeDir(){
        fsExtra.remove('./temp', err => {
             Util.log(err);
         });
    }
    public static sanitizeFileName(fileName: string){
        return fileName.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'_');
    }
}