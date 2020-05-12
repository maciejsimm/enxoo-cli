import {core, flags, SfdxCommand} from '@salesforce/command';
import {AnyJson} from '@salesforce/ts-types';
import { ProductExport } from '../../../../lib/product/ProductExport';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('enxoo', 'org');

export default class Org extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  protected static flagsConfig = {
    products: flags.array({char: 'p', required: true, description: messages.getMessage('productsFlagDescription')}),
    b2b: flags.boolean({char: 'b', required: false, description: messages.getMessage('b2bFlagDescription')}),
    related: flags.boolean({char: 'r', required: false, description: messages.getMessage('relatedFlagDescription')}),
    dir: flags.string({char: 'd', required: true, description: messages.getMessage('dirFlagDescription')}),
    currencies: flags.array({char: 'c', required: false, description: messages.getMessage('currenciesFlagDescription')})
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

    const [products, b2b, dir, related, currencies] = [this.flags.products, this.flags.b2b, this.flags.dir,
                                                      this.flags.related, this.flags.currencies];

    this.ux.log('*** Begin exporting ' + (products[0] === '*ALL' ? 'all' : products) + ' products ***');
    
    const exporter = new ProductExport(dir, conn);
    await exporter.export(products, b2b, related, currencies);

    // const exporter = new ProductExporter(products, b2b, dir, related, currencies);
    // await exporter.all(conn);
    this.ux.log('*** Finished ***');
    
    return null;
  }
}
