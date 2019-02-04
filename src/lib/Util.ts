// Class collecting all utilities 

import { core, UX } from "@salesforce/command";
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
                if (obj[prop] == null) { // cleaner structure in repo, but potentially dangerous (if someone will clear value)
                    delete obj[prop];
                    continue;
                }

                if (prop === 'attributes') {
                    delete obj[prop];
                    continue;
                }
                this.sanitizeJSON(obj[prop]);
            }
        }

        return obj;
    }

}