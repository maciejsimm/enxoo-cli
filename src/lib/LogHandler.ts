// Class for communication with the user - errors, warnings and successes.
import { core, UX } from "@salesforce/command";
import { RecordResult } from 'jsforce';

export class LogHandler {

    //@TO-DO: Consider removing showSpinner from Utils class
    //@TO-DO: Change the logging system to a separate file

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

    public static countSuccesses (sobjectsResult: Array<RecordResult>) {
        return (sobjectsResult.map((r): number => { return (r.success ? 1 : 0) })
            .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal }));
    }

    public static countErrors (sobjectsResult: Array<RecordResult>) {
        return (sobjectsResult.map((r): number => { return (r.success ? 0 : 1) })
            .reduce((prevVal: number, nextVal: number) => { return prevVal + nextVal }));
    }

    public static getErrors (sobjectsResult: Array<RecordResult>) {
        return (sobjectsResult.filter((elem) => {
            return elem.success === false;
        }).map((elem) => {
            return { "error": elem['errors'] };
        }));
    }

    public static getWarningsFromErrors(errors: Array<any>) {
        return(errors.map(e => {
            return e.error;
        }).map(el => {
            return el[0].message;
            //@TO-DO: prepare a list of messages by which the warnings are separated from errors.
        }).filter(elem => elem && elem.includes("This price definition already exists in this price book")));
    }

    public static async displayStatusMessage (sobjectsResult: Array<RecordResult>, messageString: String) {
        await this.hideSpinner(' done.' + this.prettifyUpsertMessage(messageString, 21) + 
        'Success: ' + this.countSuccesses(sobjectsResult) + '\t' + 
        'Errors: ' + this.reduceErrors(this.getErrors(sobjectsResult)).length + '\t' + 
        'Warnings: ' + this.getWarningsFromErrors(this.getErrors(sobjectsResult)).length);
    }

    public static reduceErrors(errors: Array<any>) {
        return (errors.filter(val => {
                        //@TO-DO: prepare a list of messages by which the warnings are separated from errors.
            let error = val.error.some(({ message }) => message && !message.includes("This price definition already exists in this price book"))
            return error
        }));
    }

    public static addEnxooMessages(error: any) {
        if (error.message.includes('No such column')) {
            const message = error.message;
            const debug = error;
            const fieldName = message.substring(message.indexOf('No such column') + 16, message.indexOf('on entity') - 2);
            const objectName = message.substring(message.indexOf('on entity') + 11, message.indexOf('. If you are attempting') - 1);
            const enxooErrorMessage = `This error might be caused by a difference in supported enxoo packages or some other factors. Please consider using the fieldsToIgnore feature to add ${fieldName} to the ignored fields of ${objectName} object`
            const errorObject = {...error, message, enxooErrorMessage};
            return errorObject;
        }
    }

    public static displayError(error: any) {
        const red = `\u001b[1;31m`;
        const blue = `\u001b[1;34m`;
        const white = `\u001B[37m`;
        console.log(red);
        for (const property in error) {
            if (property == 'enxooErrorMessage') {
                console.log(blue);
            }
            console.log(`${property}: ${error[property]}`);
            if (property == 'enxooErrorMessage') {
                console.log(red);
            }
        }
        console.log(white);
    }
}