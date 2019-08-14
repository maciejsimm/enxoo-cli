// Class collecting all utilities 

import { core, UX } from "@salesforce/command";
import * as fs from 'fs';
// import { type } from "os";

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
                // if (obj[prop] == null) { // cleaner structure in repo, but potentially dangerous (if someone will clear value)
                //     delete obj[prop];
                //     continue;
                // }

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
        return new Promise<string>((resolve: Function, reject: Function) => {
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
        return new Promise<string>((resolve: Function, reject: Function) => {
            let allFilePromiseArray = new Array<any>();

            fs.readdir('./' + directoryName + '/', async (err, filenames) => {
                if (err) {
                    throw err;
                }
                filenames.forEach(async (fileName) => {
                    const fileReadPromise = Util.readFile(directoryName, fileName)
                    allFilePromiseArray.push(fileReadPromise);
                });
                await Promise.all(allFilePromiseArray).then((allFileContents) => {
                    // console.log('all file contents-' + allFileContents.length);
                    resolve(allFileContents);
                })
                
            });            
        });
    }

}