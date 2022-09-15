// Class collecting all utilities 

import { core, UX } from "@salesforce/command";

export class Util {
    
	public static throwError(msg: any) {
		throw new core.SfdxError(msg, "Error", null, -1);
    }
    
    public static async showSpinner(msg: any) {
        UX.create()
            .then((ux) => {
                ux.startSpinner(msg);
            })    
    }

    public static async hideSpinner(msg: any) {
        UX.create()
            .then((ux) => {
                ux.stopSpinner(msg);
            })
    }

    public static async log(msg: any) {
        UX.create()
            .then((ux) => {
                ux.log(msg);
            })
    }

    public static async warn(msg: any) {
        UX.create()
            .then((ux) => {
                ux.warn(msg);
            })
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

    // This method will clean SObject from all unnecessary fields, ID's and blank relationship fields
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
                if (prop === 'Id') {
                    delete obj[prop];
                }
                if (prop === 'optionResources') {
                    delete obj[prop];
                }
                if (prop === 'IsStandard') {
                    delete obj[prop];
                }                

                if (prop.indexOf('__r') !== -1 && obj[prop] == null) delete obj[prop];

                if (typeof(obj[prop]) === 'object') {
                    for (let innerProp in obj[prop]) {
                        if (innerProp === 'attributes') delete obj[prop][innerProp];
                    }
                }
            }
        }

        return obj;
    }

    // This method will clean SObject from all unnecessary fields, ID's and relationships to other objects
    public static sanitizeDeepForUpsert(objParam: any) {
        
        let obj:any;

        let isArray = objParam instanceof Array;
        let isString = (typeof objParam == 'string');
        let isObject = (typeof objParam == 'object' && !isArray && !isString);

        if (isArray) {
            obj = [];
            for (let subObj of objParam) {
                obj.push(this.sanitizeDeepForUpsert(subObj));
            }
            return obj;
        }

        if (isObject) {
            obj = {};
            for (let prop in objParam) {
                if (prop === 'attributes') {
                    continue;
                }
                if (prop === 'Id') {
                    continue;
                }

                if (prop.indexOf('__r') !== -1 && objParam[prop] == null) {
                    continue;
                }

                if (prop.indexOf('__r') !== -1) {
                    // 20/05/28 - MASIM - Product2 -> Multiplier Attribute must be present because otherwise validation rule will kick in
                    if (prop !== 'enxCPQ__Multiplier_Attribute__r.enxCPQ__TECH_External_Id__c') {
                        continue;
                    }
                } 

                if (prop === 'enxCPQ__Pricing_Method__c') {
                    // 20/05/28 - MASIM - Product2 -> Pricing Method must be removed because otherwise validation rule will kick in
                    continue;
                }

                if (typeof(objParam[prop]) === 'object') {
                    for (let innerProp in objParam[prop]) {
                        if (innerProp === 'attributes') {
                            continue;
                        } 
                    }
                }

                obj[prop] = objParam[prop];
            }
            return obj;
        }
    }

    public static fixRecordTypes (arr: any, recordTypes: any, objectName: string) {
        let result = [];
        arr.forEach(elem => {
            if (elem.hasOwnProperty('RecordType')) {
                const recordType = recordTypes.find(e => e.Object === objectName && e.DeveloperName === elem.RecordType.DeveloperName);
                delete elem['RecordType'];
                elem['RecordTypeId'] = recordType.id;
            } else if (elem['RecordType.DeveloperName']){
                const recordType = recordTypes.find(e => e.Object === objectName && e.DeveloperName === elem['RecordType.DeveloperName']);
                delete elem['RecordType.DeveloperName'];
                elem['RecordTypeId'] = recordType.id;
            }
            result.push(elem);
        })
        return result;
    }

    public static sanitizeForBulkImport(objs: any){

        for(let obj of objs){
 
            for(let prop in obj){
                // Bulk API import doesn't handle objects, nested properties need to be converted into one string, e.g. 'Product2.enxCPQ__TECH_External_Id__c'
                if(typeof obj[prop] == 'object'){
                    let newProp;
                    for(let innerProp in obj[prop]){
                        newProp = prop +'.'+innerProp;
                        obj[newProp] = obj[prop][innerProp] != null ? obj[prop][innerProp] : "";
                    }
                    delete obj[prop];
                }
                // Bulk API import doesn't need special care to handle null values. From SF docs "To set a field value to null, use a field value of #N/A."
                if (obj[prop] === null) {
                    obj[prop] = '#N/A';
                }
           }
        }

        return this.fillMissingProperties(objs);
    }

    public static prettifyUpsertMessage(message:String, initialTextShift:number){
        return (message.length > initialTextShift) ? 
        (message.length > (initialTextShift + 8)) ? 
        (message.length > (initialTextShift + 16)) ? 
        (message.length > (initialTextShift + 24)) ?  
        '\t' : 
        '\t\t' : 
        '\t\t\t' : 
        '\t\t\t\t' : 
        '\t\t\t\t\t';
    }

    private static fillMissingProperties(objs){
        const template = objs.reduce((template, current) => {
                    
                return {...template, 
                        ...Object.keys(current).reduce((currentTemplate, key) => ({...currentTemplate, [key]: ''}),{})};
            }, {})
            
            return objs.map(obj=>({...template, ...obj}));
    }

}