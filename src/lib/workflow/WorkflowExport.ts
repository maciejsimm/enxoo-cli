import { FileManager } from '../file/FileManager';
import { Connection } from "@salesforce/core";
import {WorkflowSelector} from "../selector/WorkflowSelector";
import {WorkflowTaskDef} from "./WorkflowTaskDef";
import {WorkflowItem} from "./WorkflowItem";
import {WorkflowItemRule} from "./WorkflowItemRule";
import {WorkflowPlan} from "./WorkflowPlan";

export class WorkflowExport {

    private workflowTaskDefs:Array<WorkflowTaskDef>;
    private workflowItems:Array<WorkflowItem>;
    private workflowItemRules:Array<WorkflowItemRule>;
    private workflowPlans:Array<WorkflowPlan>;
    private readonly connection:Connection;
    private fileManager:FileManager;
    private readonly targetDirectory:string;

    constructor(targetDirectory:string, connection: Connection) {
        this.targetDirectory = targetDirectory;
        this.fileManager = new FileManager(targetDirectory);
        this.connection = connection;
    }

    public async export(workflowNames: Array<string>) {
        const querySettings = await this.fileManager.loadQueryConfiguration(this.targetDirectory);
        const workflowSelector = new WorkflowSelector(querySettings)

        this.fileManager.createDirectoriesForWorkflowExport();

      // -- querying files begin
        const workflowTaskDefs = await workflowSelector.getWorkflowTaskDefinitions(this.connection);
        this.workflowTaskDefs = [];
        this.wrapWorkflowTaskDefs(workflowTaskDefs);

        const workflowPlans = await workflowSelector.getWorkflowPlans(this.connection);
        this.workflowPlans = [];
        this.wrapWorkflowPlans(workflowPlans);

        const workflowItems = await workflowSelector.getWorkflowItems(this.connection);
        this.workflowItems = [];
        this.wrapWorkflowItems(workflowItems);

        const workflowItemRules = await workflowSelector.getWorkflowItemRules(this.connection);
        this.workflowItemRules = [];
        this.wrapWorkflowItemRules(workflowItemRules);

      // -- saving files begin
        await this.workflowTaskDefs.forEach((wtd) => {
          this.fileManager.deleteOldFilesWithDifferentName('workflowTaskDef', wtd.getFileName(), wtd.getWorkflowTaskDefId());
          this.fileManager.writeFile('workflowTaskDef', wtd.getFileName(), wtd);
        });

        await this.workflowPlans.forEach((wp) => {
          this.fileManager.deleteOldFilesWithDifferentName('workflowPlans', wp.getFileName(), wp.getWorkflowPlanId());
          this.fileManager.writeFile('workflowPlans', wp.getFileName(), wp);
        });

        await this.workflowItems.forEach((wi) => {
          this.fileManager.deleteOldFilesWithDifferentName('workflowItems', wi.getFileName(), wi.getWorkflowItemId());
          this.fileManager.writeFile('workflowItems', wi.getFileName(), wi);
        });

        await this.workflowItemRules.forEach((wir) => {
          this.fileManager.deleteOldFilesWithDifferentName('workflowItemRules', wir.getFileName(), wir.getWorkflowItemRuleId());
          this.fileManager.writeFile('workflowItemRules', wir.getFileName(), wir);
        });
    }

  private wrapWorkflowTaskDefs(workflowTaskDefs:Array<any>) {
    this.workflowTaskDefs = new Array<WorkflowTaskDef>();
    workflowTaskDefs.forEach((w) => {
      this.workflowTaskDefs.push(new WorkflowTaskDef(w));
    })
  }

  private wrapWorkflowItems(workflowItems:Array<any>) {
    this.workflowItems = new Array<WorkflowItem>();
    workflowItems.forEach((w) => {
      this.workflowItems.push(new WorkflowItem(w));
    })
  }

  private wrapWorkflowItemRules(workflowItemRules:Array<any>) {
    this.workflowItemRules = new Array<WorkflowItemRule>();
    workflowItemRules.forEach((w) => {
      this.workflowItemRules.push(new WorkflowItemRule(w));
    })
  }

  private wrapWorkflowPlans(workflowPlans:Array<any>) {
    this.workflowPlans = new Array<WorkflowPlan>();
    workflowPlans.forEach((w) => {
      this.workflowPlans.push(new WorkflowPlan(w));
    })
  }
}
