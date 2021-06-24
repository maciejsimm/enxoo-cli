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
                    if(err.message.includes('no such file or directory')){
                        fs.mkdirSync(path, { recursive: true });
                        await Promise.all(allFilePromiseArray).then((allFileNames) => {
                            resolve(allFileNames);
                        })
                    } else {
                        throw err;
                    }
                }
                if (fileNames){
                    allFilePromiseArray = fileNames.filter(fileName => fileName.includes('.json'));
                    await Promise.all(allFilePromiseArray).then((allFileNames) => {
                        resolve(allFileNames);
                    })
                }
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

    public async writeFile(fileDirectory:String, fileName: String, data:any) {
        const fileNameSanitized = fileName.split('/').join('')
                                          .split('\\').join('')
                                          .split(':').join('')
                                          .split('<').join('')
                                          .split('>').join('')
                                          .split('"').join('')
                                          .split('|').join('')
                                          .split('?').join('')
                                          .split('*').join('');

        const path = './' + this.directory + '/' + fileDirectory + '/' + fileNameSanitized;
        const contentJSON = JSON.stringify(Util.sanitizeJSON(data), null, 3);
        await fs.writeFile(path, contentJSON, function(err) {
            if (err) {
                return Util.log(err);
            }
        });
    }

    //Search for file with the same Tech External ID and delete it if record has different name
    public async deleteOldFilesWithDifferentName(fileDirectory:String, fileName:String, recordId:String){
        const path = './' + this.directory + '/' + fileDirectory+'/';
        let files = fs.readdirSync(path).filter(fn => fn.endsWith('_' + recordId + '.json'));
        if(files){
            files.forEach(function (value){
                fs.unlinkSync(path + value);
            });
        }
    }

    public createDirectoriesForExport() {
        let directories = ['products',
                           'resources',
                           'categories',
                           'attributes',
                           'attributeSets',
                           'priceBooks',
                           'charges',
                           'settings',
                           'approvalRules'];

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

  public async loadQueryConfiguration(queryDir: string) {
    return new Promise<String>((resolve: Function, reject: Function) => {
      let content;
      fs.readFile('./' + queryDir + '/queryConfiguration.json', function read(err, data) {
        if (err) {
          if (err.code == 'ENOENT') {
            resolve({});
          }
          reject(err);
        } else {
          content = data.toString('utf8');
          resolve(JSON.parse(content));
        }
      });
    });
  }

}
