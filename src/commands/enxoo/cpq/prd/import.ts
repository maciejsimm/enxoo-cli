import {core, flags, SfdxCommand} from '@salesforce/command';
import {AnyJson} from '@salesforce/ts-types';
import { ProductImporter } from '../../../../lib/ProductImporter';
import {getJsforceConnection } from '../../../../lib/jsforceHelper';
import { Connection } from 'jsforce';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('enxoo', 'org');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static flagsConfig = {
    // flag with a value (-p, --product=VALUE)
    products: flags.array({char: 'p', required: true, description: messages.getMessage('productsFlagDescription')}),
    force: flags.boolean({char: 'f', description: messages.getMessage('forceFlagDescription')}),
    b2b: flags.boolean({char: 'b', required: false, description: messages.getMessage('b2bFlagDescription')}),
    dir: flags.string({char: 'd', required: true, description: messages.getMessage('dirFlagDescription')})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    let conn: Connection;
    conn = await getJsforceConnection(this.org.getConnection().getConnectionOptions());
    let userName = this.org.getUsername();

    conn.bulk.pollInterval = 5000; // 5 sec
    conn.bulk.pollTimeout = 300000; //300 sec
    const products = this.flags.products;
    const b2b = this.flags.b2b;
    const dir = this.flags.dir;

    this.ux.log('*** Begin Importing ' + (products[0] === '*ALL' ? 'all' : products) + ' products ***');

    const importer = new ProductImporter(products, b2b, dir, userName);
    await importer.all(conn);

    this.ux.log('*** Finished ***');
    
    return null;
  }
}
