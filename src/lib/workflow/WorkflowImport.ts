import {WorkflowTaskDef} from "./WorkflowTaskDef";
import {WorkflowItem} from "./WorkflowItem";
import {WorkflowItemRule} from "./WorkflowItemRule";
import {WorkflowPlan} from "./WorkflowPlan";
import { FileManager } from '../file/FileManager';
import { Connection } from "@salesforce/core";
import { Upsert } from '../repository/Upsert';
import {Util} from "../Util";
import {WorkflowSelector} from "../selector/WorkflowSelector";
import {Query} from "../selector/Query";
export class WorkflowImport {

  private workflowTaskDefs:Array<WorkflowTaskDef>;
  private workflowItems:Array<WorkflowItem>;
  private workflowItemRules:Array<WorkflowItemRule>;
  private workflowPlans:Array<WorkflowPlan>;
  private targetDirectory:string;
  private connection:Connection;
  private fileManager:FileManager;
  private fieldsToIgnore: any;
  private recordTypes: any;

    constructor(targetDirectory:string, connection: Connection) {
        this.targetDirectory = targetDirectory;
        this.fileManager = new FileManager(targetDirectory);
        this.connection = connection;
    }
    private async setFieldsToIgnore() {
      const querySettings : any = await this.fileManager.loadQueryConfiguration(this.targetDirectory);
      this.fieldsToIgnore = querySettings.fieldsToIgnore ? querySettings.fieldsToIgnore : [];
    }

    public async import() {

      const workflowSelector = new WorkflowSelector();
      this.recordTypes = await workflowSelector.getRecordTypes(this.connection);

      await this.setFieldsToIgnore();
      await this.setWorkflowTaskDefImportScope();
      await this.setWorkflowTaskOwnership();
      await this.setWorkflowPlanImportScope();
      await this.setWorkflowItemImportScope();
      await this.setWorkflowItemRuleImportScope();

      await Upsert.disableTriggers(this.connection);

      //  -- workflow task definitions import begins
      if (this.workflowTaskDefs.length) {
        this.workflowTaskDefs.forEach(wtd => {
          const recordTypeId = this.recordTypes.filter(e => e.Object === 'enxCPQ__WorkflowTaskDefinition__c').find(e => e.DeveloperName === wtd.record.RecordType.DeveloperName).id;
          delete wtd.record.RecordType;
          wtd.record.RecordTypeId = recordTypeId;
        });
        const allWorkflowTaskDefs = this.workflowTaskDefs.map((a) => {return a.record});
        await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allWorkflowTaskDefs), 'enxCPQ__WorkflowTaskDefinition__c');
      }
      //  -- workflow task definitions import ends

      //  -- workflow plans import begins
      if (this.workflowPlans.length) {
        const allWorkflowPlans = this.workflowPlans.map((a) => {return a.record});
        await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allWorkflowPlans), 'enxCPQ__WorkflowPlan__c');
      }
      //  -- workflow plans import ends

      //  -- workflow items import begins
      if (this.workflowItems.length) {
        const allWorkflowItems = this.workflowItems.map((a) => {return a.record});
        await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allWorkflowItems), 'enxCPQ__WorkflowItem__c');
      }
      //  -- workflow items import ends

      //  -- workflow item rules import begins
      if (this.workflowItemRules.length) {
        const allWorkflowItemRules = this.workflowItemRules.map((a) => {return a.record});
        await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allWorkflowItemRules), 'enxCPQ__WorkflowItemRule__c');
      }
      //  -- workflow item rules import ends

      await Upsert.enableTriggers(this.connection);
    }

  private async setWorkflowTaskDefImportScope() {
    this.workflowTaskDefs = [];

    let workflowTaskDefFileNames = await this.getAllObjects('workflowTaskDef');
    let wtdJSONArray = [];
    workflowTaskDefFileNames.forEach((fileName) => {
      const workflowInputReader = this.fileManager.readFile('workflowTaskDef', fileName);
      wtdJSONArray.push(workflowInputReader);
    });

    return Promise.all(wtdJSONArray).then((values) => {
      values.forEach((wtd) => {
        const workflowTaskDefObj:WorkflowTaskDef = new WorkflowTaskDef(null);
        workflowTaskDefObj.fillFromJSON(wtd);

        if(this.fieldsToIgnore['workflowTaskDefinition']) {
          this.fieldsToIgnore['workflowTaskDefinition'].forEach( field => {
            delete workflowTaskDefObj.record[field];
          });
        }

        this.workflowTaskDefs.push(workflowTaskDefObj);
      });
    })
  }

  private async setWorkflowPlanImportScope() {
    this.workflowPlans = [];

    let workflowPlanFileNames = await this.getAllObjects('workflowPlans');
    let wtdJSONArray = [];
    workflowPlanFileNames.forEach((fileName) => {
      const workflowInputReader = this.fileManager.readFile('workflowPlans', fileName);
      wtdJSONArray.push(workflowInputReader);
    });

    return Promise.all(wtdJSONArray).then((values) => {
      values.forEach((wtd) => {
        const workflowPlanObj:WorkflowPlan = new WorkflowPlan(null);
        workflowPlanObj.fillFromJSON(wtd);

        if(this.fieldsToIgnore['workflowPlan']) {
          this.fieldsToIgnore['workflowPlan'].forEach( field => {
            delete workflowPlanObj.record[field];
          });
        }

        this.workflowPlans.push(workflowPlanObj);
      });
    })
  }

  private async setWorkflowItemImportScope() {
    this.workflowItems = [];

    let workflowItemFileNames = await this.getAllObjects('workflowItems');
    let wtdJSONArray = [];
    workflowItemFileNames.forEach((fileName) => {
      const workflowInputReader = this.fileManager.readFile('workflowItems', fileName);
      wtdJSONArray.push(workflowInputReader);
    });

    return Promise.all(wtdJSONArray).then((values) => {
      values.forEach((wtd) => {
        const workflowItemObj:WorkflowItem = new WorkflowItem(null);
        workflowItemObj.fillFromJSON(wtd);

        if(this.fieldsToIgnore['workflowItem']) {
          this.fieldsToIgnore['workflowItem'].forEach( field => {
            delete workflowItemObj.record[field];
          });
        }

        this.workflowItems.push(workflowItemObj);
      });
    })
  }

  private async setWorkflowItemRuleImportScope() {
    this.workflowItemRules = [];

    let workflowItemRuleFileNames = await this.getAllObjects('workflowItemRules');
    let wtdJSONArray = [];
    workflowItemRuleFileNames.forEach((fileName) => {
      const workflowInputReader = this.fileManager.readFile('workflowItemRules', fileName);
      wtdJSONArray.push(workflowInputReader);
    });

    return Promise.all(wtdJSONArray).then((values) => {
      values.forEach((wtd) => {
        const workflowItemRuleObj:WorkflowItemRule = new WorkflowItemRule(null);
        workflowItemRuleObj.fillFromJSON(wtd);

        if(this.fieldsToIgnore['workflowItemRule']) {
          this.fieldsToIgnore['workflowItemRule'].forEach( field => {
            delete workflowItemRuleObj.record[field];
          });
        }

        this.workflowItemRules.push(workflowItemRuleObj);
      });
    })
  }

  private async getAllObjects(objectName:string) {
    return await this.fileManager.readAllFileNames(objectName);
  }

  private async setWorkflowTaskOwnership(){
    let userIdEmails = new Map(); //key is email, value is list of IDs
    let queueIdName = new Map(); //key is queue name, value is ID
    let userEmails = new Set();
    let queueNames = new Set();
    this.workflowTaskDefs.forEach(task => {
      if(task.record.OwnerEmail){
        userEmails.add(task.record.OwnerEmail);
      } else if(task.record.OwnerQueue){
        queueNames.add(task.record.OwnerQueue);
      }
    });
    const queryUser = "SELECT Id, Email FROM User WHERE Email IN ('" + Array.from(userEmails).join('\',\'') + "')";
    const queryQueue = "SELECT Id, Name FROM Group WHERE Type = 'Queue' AND Name IN ('" + Array.from(queueNames).join('\',\'') + "')";
    const users = await Query.executeQuery(this.connection, queryUser, 'provisioning task user owner');
    const queues = await Query.executeQuery(this.connection, queryQueue, 'provisioning task queue owner');
    users.forEach( (u) => {
      // @ts-ignore-start
      if(userIdEmails.get(u.Email)){
        // @ts-ignore
        let listOfIds = userIdEmails.get(u.Email);
        // @ts-ignore
        listOfIds.push(u.Id);
        // @ts-ignore
        userIdEmails.set(u.Email, listOfIds);
      } else {
        // @ts-ignore
        userIdEmails.set(u.Email, [u.Id]);
      }
    });
    queues.forEach( (q) => {
      // @ts-ignore
      queueIdName.set(q.Name, q.Id);
    });
    for(let task of this.workflowTaskDefs){
      if(task.record.OwnerEmail){
        if(userIdEmails.get(task.record.OwnerEmail) && userIdEmails.get(task.record.OwnerEmail).length === 1){
          task.record.OwnerId = userIdEmails.get(task.record.OwnerEmail)[0];
        } else{
          // if there is more than one user with owner email system should set owner to system administrator what is default behaviour and ownerId is not needed
          delete task.record.OwnerId;
        }
        delete task.record.OwnerEmail;
      } else if(task.record.OwnerQueue){
        if(queueIdName.get(task.record.OwnerQueue)){
          task.record.OwnerId = queueIdName.get(task.record.OwnerQueue);
        } else {
          // if queue name doesnt exist on target org than system should set owner to system administrator
          delete task.record.OwnerId;
        }
        delete task.record.OwnerQueue;
      }
    }
  }

}
