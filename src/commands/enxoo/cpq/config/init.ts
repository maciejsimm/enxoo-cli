import { core, flags, SfdxCommand } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { Util } from '../../../../lib/Util';
import { FileManager } from '../../../../lib/file/FileManager';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('enxoo', 'org');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static flagsConfig = {
    // flag with a value (-p, --product=VALUE)
    b2b: flags.boolean({ char: 'b', required: false, description: messages.getMessage('b2bFlagDescription') }),
    dir: flags.string({ char: 'd', required: true, description: messages.getMessage('dirFlagDescription') })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    const b2b = this.flags.b2b;
    const dir = this.flags.dir;

    Util.log('*** Initializing configuration file for ' + (b2b ? 'B2B + CPQ' : 'CPQ') + ' setup ***');
    Util.showSpinner('-- Writing queryConfiguration.json file ');

    const fileManager = new FileManager(dir, b2b);
    // @TO-DO 1. include comment in a file
    // @TO-DO 2. documentation of this method in Knowledge Base
    fileManager.writeFile('', 'queryConfiguration.json', this.configurationObject);

    // @TO-DO 1. include comment in a file
    // @TO-DO 2. documentation of this method in Knowledge Base
    // fileManager.writeFile('', 'fieldsToIgnore.json', this.configurationObject);

    Util.hideSpinner(' done');
    Util.log('*** Finished ***');

    return null;
  }

  private messageLine1 = '// In this file, for each object you can specify comma separated list of custom fields that will be injected in query:';
  private messageLine2 = '//    Example: product: [\'billing_label_1__c\', \'billing_label_2__c\']';

  private configurationObject = {
    customFields: {
      product: [],
      productOption: [],
      bundleElement: [],
      bundleElementOption: [],
      pricebook: [],
      pbe: [],
      productAttr: [],
      attrSetAttr: [],
      attr: [],
      attrValues: [],
      attrDefaultValues: [],
      productRelationships: [],
      attrValueDependency: [],
      attrRules: [],
      category: [],
      attrSet: [],
      prvPlanAssignment: [],
      prvTask: [],
      prvPlan: [],
      prvTaskAssignment: [],
      productResources: []
    },
    fieldsToIgnore: {
      product: [],
      productOption: [],
      bundleElement: [],
      bundleElementOption: [],
      pricebook: [],
      pbe: [],
      productAttr: [],
      attrSetAttr: [],
      attr: [],
      attrValues: [],
      attrDefaultValues: [],
      productRelationships: [],
      attrValueDependency: [],
      attrRules: [],
      category: [],
      attrSet: [],
      prvPlanAssignment: [],
      prvTask: [],
      prvPlan: [],
      prvTaskAssignment: [],
      productResources: []
    },
    settingsToIgnore: {
      settingName: ["B2B_VENDOR_SCREEN_PUBLIC_SITE_URL", "LAST_OLI_NUMBER", "MAP_PROVIDER_API_KEY"]
    }
  };

}
