import {core, flags, SfdxCommand} from '@salesforce/command';
import {AnyJson} from '@salesforce/ts-types';
import { ProductImport } from '../../../../lib/product/ProductImport';
import { Util } from '../../../../lib/Util';

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
    b2b: flags.boolean({char: 'b', required: false, description: messages.getMessage('b2bFlagDescription')}),
    related: flags.boolean({char: 'r', required: false, description: messages.getMessage('relatedFlagDescription')}),
    dir: flags.string({char: 'd', required: true, description: messages.getMessage('dirFlagDescription')}),
    currencies: flags.array({char: 'c', required: false, description: messages.getMessage('currenciesFlagDescription')}),
    retry: flags.array({char: 'a', required: false, description: messages.getMessage('retryFlagDescription')}),
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  protected static numberOfRetries = 0;

  public async run(): Promise<AnyJson> {

    const conn = this.org.getConnection();
    conn['maxRequest'] = 5000;
    
    const [products, b2b, dir, currencies] = [this.flags.products, this.flags.b2b, this.flags.dir, this.flags.currencies]

    Util.log('*** Begin Importing ' + (products[0] === '*ALL' ? 'all' : products) + ' products ***');

    const importer = new ProductImport(dir, conn, b2b);
    try {
      await importer.import(products, currencies);
    } catch(error) {
      this.handleError();
      return null;
    }
    
    Util.log('*** Finished ***');
    
    return null;
  }

  private handleError() {
    const retryNo = this.flags.retry;
    if (Org.numberOfRetries < retryNo) {
      Org.numberOfRetries++;
      Util.log('*** RETRY ' + Org.numberOfRetries + '/' + retryNo +  '***');
      this.run();
    }
  }

}
