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
import { threadId } from 'worker_threads';

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

        await this.setProductImportScope(productNames);
        await this.setCategoryImportScope();
        await this.setParentCategoryImportScope();
        
        const allCategories =  this.categories.map((c) => {return c.record});
        const allCategoriesWithouthRelationships = Util.sanitizeDeepForUpsert(allCategories);

        await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allCategoriesWithouthRelationships), 'enxCPQ__Category__c');
        await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allCategories), 'enxCPQ__Category__c');

    }

    private async setProductImportScope(productToImportNames: Array<string>) {
        
        const allProductsLocal = await this.getAllProductsLocal();

        this.products = [];
        this.productIds = [];

        let productFileNames;

        if (productToImportNames[0] === '*ALL') { 
            productFileNames = allProductsLocal;
        } else {
            productFileNames = allProductsLocal.filter((elem) => {
                                                            return productToImportNames.includes(elem.substring(0, elem.indexOf('_PRD')));
                                                       });
        }
        
        let productJSONArray = [];
        productFileNames.forEach((fileName) => {
            const productInputReader = this.fileManager.readFile('products', fileName);
            productJSONArray.push(productInputReader);
        });

        return Promise.all(productJSONArray).then((values) => {
            const productsJSONs = values;

            productsJSONs.forEach((prd) => {
                const prodObj:Product = new Product(null);
                prodObj.fillFromJSON(prd);

                this.products.push(prodObj);
                this.productIds.push(prodObj.getProductId());
            });

            if (this.productIds.length === 0) {
                Util.throwError('Nothing to import');
            }
        })
    }

    private async setCategoryImportScope() {
        this.categoryIds = [];
        this.categories = [];
        this.products.forEach((product) => {
            const categoryId = product.getCategoryId();
            if (categoryId !== null) this.categoryIds.push(categoryId);
        });

        const allCategoryFileNames = await this.fileManager.readAllFileNames('categories');

        const categoryFileNames = allCategoryFileNames.filter((elem) => {
            const fileNameId = elem.substring(elem.indexOf('_CAT')+1, elem.indexOf('.json'));
            return this.categoryIds.includes(fileNameId);
        });

        let categoryJSONArray = [];
        categoryFileNames.forEach((fileName) => {
            const categoryInputReader = this.fileManager.readFile('categories', fileName);
            categoryJSONArray.push(categoryInputReader);
        });

        return Promise.all(categoryJSONArray).then((values) => {
            const categoryJSONs = values;

            categoryJSONs.forEach((cat) => {
                const catObj:Category = new Category(null);
                catObj.fillFromJSON(cat);

                this.categories.push(catObj);
            });
        });
    }

    private async setParentCategoryImportScope() {
        let allCategoriesIdentified = false;

        while (!allCategoriesIdentified) {
            let parentCategoryIds = [];
            this.categories.forEach((cat) => {
                const parentCategoryId = cat.getParentCategory();
                if (parentCategoryId !== null && !this.categoryIds.includes(parentCategoryId)) {
                    this.categoryIds.push(parentCategoryId);
                    parentCategoryIds.push(parentCategoryId);
                }
            });

            if (parentCategoryIds.length === 0) allCategoriesIdentified = true;

            const allCategoryFileNames = await this.fileManager.readAllFileNames('categories');

            const categoryFileNames = allCategoryFileNames.filter((elem) => {
                const fileNameId = elem.substring(elem.indexOf('_CAT')+1, elem.indexOf('.json'));
                return parentCategoryIds.includes(fileNameId);
            });
    
            let categoryJSONArray = [];
            categoryFileNames.forEach((fileName) => {
                const categoryInputReader = this.fileManager.readFile('categories', fileName);
                categoryJSONArray.push(categoryInputReader);
            });
    
            await Promise.all(categoryJSONArray).then((values) => {
                const categoryJSONs = values;
    
                categoryJSONs.forEach((cat) => {
                    const catObj:Category = new Category(null);
                    catObj.fillFromJSON(cat);
    
                    this.categories.push(catObj);
                });
            });
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