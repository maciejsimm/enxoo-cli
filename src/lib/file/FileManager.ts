import * as fs from 'fs';
import { Util } from './../Util';

export class FileManager {

    private directory:String;
    private isB2B:Boolean;

    constructor(directory:String, isB2B = false) {
        this.directory = directory;
        this.isB2B = isB2B;
    }

    public async readAllFileNames(fileDirectory:string) {
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            const path = './' + this.directory + '/' + fileDirectory;
            let allFilePromiseArray = new Array<any>();
            fs.readdir(path, async(err, fileNames) => {
                if (err) {
                    throw err;
                }
                allFilePromiseArray = fileNames.filter(fileName => fileName.includes('.json'));
                await Promise.all(allFilePromiseArray).then((allFileNames) => {
                    resolve(allFileNames);
                })
            })
        })
    }

    public async readFile(fileDirectory: String, fileName: String) {
        return new Promise<String[]>((resolve: Function, reject: Function) => {
            let content;
            const path = './' + this.directory + '/' + fileDirectory;
            fs.readFile(path + '/' + fileName, function read(err, data) {
                if (err) {
                    reject(err);
                }
                content = data.toString('utf8');
                resolve(content);
            });
        });
    }

    // public static async readAllFiles(directoryName: String, currencies?: Set<String>) {
    //     return new Promise<String[]>((resolve: Function, reject: Function) => {
    //         let allFilePromiseArray = new Array<any>();
    //         fs.readdir('./' + this.dir + directoryName + '/', async (err, filenames) => {
    //             if (err) {
    //                 throw err;
    //             }
    //             if(currencies){
    //                 allFilePromiseArray= filenames.filter(fileName => fileName.includes('.json'))
    //                                               .filter(fileName => currencies.has(fileName.replace('.json','')))
    //                                               .map(async fileName =>  this.readFile(directoryName, fileName));
                     
    //             }else{
    //                 allFilePromiseArray= filenames.filter(fileName => fileName.includes('.json'))
    //                                               .map(async fileName =>  this.readFile(directoryName, fileName));
    //             }
    //             await Promise.all(allFilePromiseArray).then((allFileContents) => {
    //                 resolve(allFileContents);
    //             })
    //         })
    //     });            
    // }

    public async writeFile(fileDirectory:String, fileName: String, data:any) {
        const path = './' + this.directory + '/' + fileDirectory + '/' + fileName;
        const contentJSON = JSON.stringify(Util.sanitizeJSON(data), null, 3);
        await fs.writeFile(path, contentJSON, function(err) {
            if (err) {
                return Util.log(err);
            }
        });
    }

    public createDirectoriesForExport() {
        let directories = ['products', 
                           'categories', 
                           'attributes', 
                           'attributeSets', 
                           'priceBooks', 
                           'charges', 
                           'bundleElements'];

        if (this.isB2B) {
            directories.push('provisioningPlans',
                             'provisioningTasks');
        }

        directories.forEach((dir) => {
            const path = './' + this.directory + '/' + dir;
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, { recursive: true });
            }
        })
    }


}