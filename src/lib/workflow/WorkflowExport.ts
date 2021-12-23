import { FileManager } from '../file/FileManager';
import { Connection } from "@salesforce/core";
import {WorkflowSelector} from "../selector/WorkflowSelector";
import {Workflow} from "./Workflow";
import {WorkflowTaskDef} from "./WorkflowTaskDef";
import {WorkflowTask} from "./WorkflowTask";
import {WorkflowItem} from "./WorkflowItem";
import {WorkflowItemRule} from "./WorkflowItemRule";
import {WorkflowPlan} from "./WorkflowPlan";

export class WorkflowExport {

    private workflows:Array<Workflow>;
    private workflowTaskDefs:Array<WorkflowTaskDef>;
    private workflowTasks:Array<WorkflowTask>;
    private workflowItems:Array<WorkflowItem>;
    private workflowItemRules:Array<WorkflowItemRule>;
    private workflowPlans:Array<WorkflowPlan>;
    private workflowNames:Array<string>;
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
        const workflows = await workflowSelector.getWorkflows(this.connection);
        this.workflows = [];
        this.wrapWorkflows(workflows);

        const workflowTaskDefs = await workflowSelector.getWorkflowTaskDefinitions(this.connection);
        this.workflowTaskDefs = [];
        this.wrapWorkflowTaskDefs(workflowTaskDefs);

        const workflowTasks = await workflowSelector.getWorkflowTasks(this.connection);
        this.workflowTasks = [];
        this.wrapWorkflowTasks(workflowTasks);

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
        await this.workflows.forEach((workflow) => {
          this.fileManager.deleteOldFilesWithDifferentName('workflows', workflow.getFileName(), workflow.getWorkflowId());
          this.fileManager.writeFile('workflows', workflow.getFileName(), workflow);
        });

        await this.workflowTaskDefs.forEach((wtd) => {
          this.fileManager.deleteOldFilesWithDifferentName('workflowTaskDef', wtd.getFileName(), wtd.getWorkflowTaskDefId());
          this.fileManager.writeFile('workflowTaskDef', wtd.getFileName(), wtd);
        });

        await this.workflowTasks.forEach((wt) => {
          this.fileManager.deleteOldFilesWithDifferentName('workflowTasks', wt.getFileName(), wt.getWorkflowTaskId());
          this.fileManager.writeFile('workflowTasks', wt.getFileName(), wt);
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

  private wrapWorkflows(workflows:Array<any>) {
    this.workflows = new Array<Workflow>();
    workflows.forEach((w) => {
      this.workflows.push(new Workflow(w));
    })
  }

  private wrapWorkflowTaskDefs(workflowTaskDefs:Array<any>) {
    this.workflowTaskDefs = new Array<WorkflowTaskDef>();
    workflowTaskDefs.forEach((w) => {
      this.workflowTaskDefs.push(new WorkflowTaskDef(w));
    })
  }

  private wrapWorkflowTasks(workflowTasks:Array<any>) {
    this.workflowTasks = new Array<WorkflowTask>();
    workflowTasks.forEach((w) => {
      this.workflowTasks.push(new WorkflowTask(w));
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
