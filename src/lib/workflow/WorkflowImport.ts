import {WorkflowTaskDef} from "./WorkflowTaskDef";
import {WorkflowItem} from "./WorkflowItem";
import {WorkflowItemRule} from "./WorkflowItemRule";
import {WorkflowPlan} from "./WorkflowPlan";
import { FileManager } from '../file/FileManager';
import { Connection } from "@salesforce/core";
import { Upsert } from '../repository/Upsert';
import {Util} from "../Util";

export class WorkflowImport {

  private workflowIds:Array<String>;
  private workflowTaskDefs:Array<WorkflowTaskDef>;
  private workflowItems:Array<WorkflowItem>;
  private workflowItemRules:Array<WorkflowItemRule>;
  private workflowPlans:Array<WorkflowPlan>;
  private workflowNames:Array<string>;
  private targetDirectory:string;
  private connection:Connection;
  private fileManager:FileManager;
  private fieldsToIgnore: any;

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

      await this.setFieldsToIgnore();
      await this.setWorkflowTaskDefImportScope();
      await this.setWorkflowPlanImportScope();
      await this.setWorkflowItemImportScope();
      await this.setWorkflowItemRuleImportScope();

      await Upsert.disableTriggers(this.connection);

      //  -- workflow task definitions import begins
      if (this.workflowTaskDefs.length) {
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

}
