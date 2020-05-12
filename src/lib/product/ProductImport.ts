import { ProductSelector } from './../selector/ProductSelector';
import { Product } from './Product';
import { Attribute } from './Attribute';
import { Charge } from './Charge';
import { Category } from './Category';
import { FileManager } from './../file/FileManager';
import { Connection } from "@salesforce/core";
import { Upsert } from './../repository/Upsert';
import { Util } from './../Util';
import * as fs from 'fs';

export class ProductImport {

    private productIds:Array<String>;
    private attributeIds:Array<String>;
    private categoryIds:Array<String>;
    private attributeSetIds:Array<String>;
    private priceBookIds:Array<String>;
    private chargeIds:Array<String>;

    private products:Array<Product>;
    private attributes:Array<Attribute>;
    private charges:Array<Charge>;
    private categories:Array<Category>;

    private targetDirectory:string;
    private connection:Connection;
    private fileManager:FileManager;

    constructor(targetDirectory:string, connection: Connection) {
        this.targetDirectory = targetDirectory;
        this.fileManager = new FileManager(targetDirectory);
        this.connection = connection;
    }

    public async import(productNames: Array<string>,
                        exportB2BObjects: Boolean,
                        currencyNames: Set<String>) {


        const productSelector = new ProductSelector();
        const allProductsLocal = await this.getAllProductsLocal();
        const allProductsRemote = await this.getAllProductsRemote(productSelector);

        console.log('allProductsLocal ' + allProductsLocal.length);
        console.log('allProductsRemote ' + allProductsRemote.length);

        this.setProductImportScope(productNames, allProductsLocal, allProductsRemote);


        // // -- products begin
        

        // console.log('len: ' + this.products.length);

        // await Upsert.upsertData(this.connection, this.products.map((p) => {return p.record}), 'Product2');

        // // -- categories begin
        // const categoriesJSONs = await this.fileManager.readAllFiles('categories');
        // // @ts-ignore
        // this.categories = categoriesJSONs.map((catString) => { let res = new Category(null); res.fillFromJSON(catString); return res; });

        // await Upsert.upsertData(this.connection, this.categories.map((c) => {return c.record}), 'enxCPQ__Category__c');
    


        // // -- categories end

        // return true;

    }

    private setProductImportScope(productToImportNames: Array<string>, allProductsLocal: Array<string>, allProductsRemote: Array<any>) {
        // @TO_DO

        if (productToImportNames[0] === '*ALL') { 

        } else {

        }
        
        // const productJSONs = await this.fileManager.readAllFiles('products');
        // // @ts-ignore
        // this.products = productJSONs.map((str) => { let res = new Product(null); res.fillFromJSON(str); return res; })
        //                             .filter((elem) => { return productNames.indexOf(elem.record.Name) !== -1 });

        // if (productToImportNames[0] === '*ALL') { 
        //     this.productIds = allProducts.map((p) => { return p.id; });
        // } else {
        //     this.productIds = [];
        //     productToImportNames.forEach((name) => {
        //         const elem = allProducts.find(e => e.name === name);
        //         if (elem === undefined) {
        //             Util.warn('Product named ' + name + ' not found in target environment. Skipping');
        //         } else {
        //             this.productIds.push(elem.id);
        //         }
        //     });
        // }

        if (this.productIds.length === 0) {
            Util.throwError('Nothing to import');
        }
    }

    private async getAllProductsLocal() {
        const productFileNames = await this.fileManager.readAllFileNames('products');
        return productFileNames;
    }

    private async getAllProductsRemote(selector:ProductSelector) {
        const productList = await selector.getAllProducts(this.connection);
        const productNames = [...productList];
        return productNames;
    }   

}