import {core, flags, SfdxCommand} from '@salesforce/command';
import {AnyJson} from '@salesforce/ts-types';
import { SettingsExport } from '../../../../lib/settings/SettingsExport';

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
    // const name = this.flags.name || 'world';

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    // let conn: Connection;
    // conn = await getJsforceConnection(this.org.getConnection().getConnectionOptions());
    const conn = this.org.getConnection();

    const dir = this.flags.dir;

    this.ux.log('*** Begin exporting settings ***');
    
    const exporter = new SettingsExport(dir, conn);
    await exporter.export();

    this.ux.log('*** Finished ***');
    
    return null;
  }
}
