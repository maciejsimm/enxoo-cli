import { Util } from './Util';
import { Connection } from '@salesforce/core/lib/connection';
export class Queries {

    public static async describeAllFields(conn: Connection, sObjectName: string): Promise<String[]> {
        Util.log('--- describing all fields for sObject Name ' + sObjectName);
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            conn.sobject(sObjectName).describe(function(err, meta) {
                if (err) { return console.log(err); }
                resolve(meta.fields);
              });
        })
    }


}
