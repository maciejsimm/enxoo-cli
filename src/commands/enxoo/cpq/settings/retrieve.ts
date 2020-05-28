import {core, flags, SfdxCommand} from '@salesforce/command';
import {AnyJson} from '@salesforce/ts-types';
import { SettingsExport } from '../../../../lib/settings/SettingsExport';
import { Util } from '../../../../lib/Util';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('enxoo', 'org');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static flagsConfig = {
    dir: flags.string({char: 'd', required: true, description: messages.getMessage('dirFlagDescription')})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const conn = this.org.getConnection();
    const dir = this.flags.dir;

    Util.log('*** Begin exporting settings ***');
    
    // @TO-DO documentation of this method in Knowledge Base

    const exporter = new SettingsExport(dir, conn);
    await exporter.export();

    Util.log('*** Finished ***');
    
    return null;
  }
}
