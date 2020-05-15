import { ProductSelector } from './../selector/ProductSelector';
import { Product } from './Product';
import { Attribute } from './Attribute';
import { AttributeSet } from './AttributeSet';
import { Charge } from './Charge';
import { Category } from './Category';
import { FileManager } from './../file/FileManager';
import { Connection } from "@salesforce/core";
import { Upsert } from './../repository/Upsert';
import { Util } from './../Util';
import * as fs from 'fs';
import { threadId } from 'worker_threads';
import { resolve } from 'dns';

export class ProductImport {

    private productIds:Array<String>;
    private attributeIds:Array<String>;
    private categoryIds:Array<String>;
    private attributeSetIds:Array<String>;
    private priceBookIds:Array<String>;
    private chargeIds:Array<String>;

    private products:Array<Product>;
    private attributes:Array<Attribute>;
    private attributeSets:Array<AttributeSet>;
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
        await this.setAttributeSetImportScope();
        await this.setCategoryImportScope();
        await this.setAttributeImportScope();
        await this.setParentCategoryImportScope();
        
        // -- attribute sets import begin
        if (this.attributeSetIds.length > 0) {
            const allAttributeSets = this.attributeSets.map((a) => {return a.record});
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allAttributeSets), 'enxCPQ__AttributeSet__c');
        }
        // -- attribute sets import end

        
        // -- categories import begin
        if (this.categoryIds.length > 0) {
            const allCategories =  this.categories.map((c) => {return c.record});
            const allCategoriesWithouthRelationships = Util.sanitizeDeepForUpsert(allCategories);

            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allCategoriesWithouthRelationships), 'enxCPQ__Category__c');
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allCategories), 'enxCPQ__Category__c');
        }
        // -- categories import end


        // -- attributes import begin
        if (this.attributeIds.length > 0) {
            const allAttributes = this.attributes.map((a) => {return a.record});
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allAttributes), 'enxCPQ__Attribute__c');
        }
        // -- attributes import end


        // -- products import begin
        if (this.productIds.length > 0) {
            let allProducts = [];
            this.products.forEach(product => { allProducts = [...allProducts, ... product.getProducts()] });
            const allProductsWithouthRelationships = Util.sanitizeDeepForUpsert(allProducts);

            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allProductsWithouthRelationships), 'Product2');
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allProducts), 'Product2');
        }
        // -- products import end


        // -- attributes values import begin
        let allAttributeValues = [];
        this.attributes.forEach((attr) => { allAttributeValues = [...allAttributeValues, ...attr.attributeValues] });
        this.products.forEach((prod) => { allAttributeValues = [...allAttributeValues, ...prod.attributeValues] });
        // @TO-DO handle array > 200 items
        await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allAttributeValues), 'enxCPQ__AttributeValue__c');
        // -- attributes values import end

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

    private async setAttributeSetImportScope() {
        this.attributeSetIds = [];
        this.attributeSets = [];

        this.products.forEach(product => {
            this.attributeSetIds = [...this.attributeSetIds, ...new Set(product.getAttributeSetIds())];
        });

        if (this.attributeSetIds.length > 0) {
            const allAttributeSetFileNames = await this.fileManager.readAllFileNames('attributeSets');

            const attributeSetFileNames = allAttributeSetFileNames.filter((elem) => {
                const fileNameId = elem.substring(elem.indexOf('_ATS')+1, elem.indexOf('.json'));
                return this.attributeSetIds.includes(fileNameId);
            });

            let attributeSetJSONArray = [];
            attributeSetFileNames.forEach((fileName) => {
                const attributeSetInputReader = this.fileManager.readFile('attributeSets', fileName);
                attributeSetJSONArray.push(attributeSetInputReader);
            });

            return Promise.all(attributeSetJSONArray).then((values) => {
                const attributeSetJSONs = values;

                attributeSetJSONs.forEach((ast) => {
                    const astObj:AttributeSet = new AttributeSet(null);
                    astObj.fillFromJSON(ast);
    
                    this.attributeSets.push(astObj);
                });
            });
        }
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

    private async setAttributeImportScope() {
        this.attributeIds = [];
        this.attributes = [];

        this.products.forEach(product => {
            this.attributeIds = [...this.attributeIds, ...new Set(product.getAttributeIds())];
        });

        if (this.attributeIds.length > 0) {
            const allAttributeFileNames = await this.fileManager.readAllFileNames('attributes');

            const attributeFileNames = allAttributeFileNames.filter((elem) => {
                const fileNameId = elem.substring(elem.indexOf('_ATR')+1, elem.indexOf('.json'));
                return this.attributeIds.includes(fileNameId);
            });

            let attributeJSONArray = [];
            attributeFileNames.forEach((fileName) => {
                const attributeInputReader = this.fileManager.readFile('attributes', fileName);
                attributeJSONArray.push(attributeInputReader);
            });

            return Promise.all(attributeJSONArray).then((values) => {
                const attributeJSONs = values;

                attributeJSONs.forEach((atr) => {
                    const atrObj:Attribute = new Attribute(null);
                    atrObj.fillFromJSON(atr);
    
                    this.attributes.push(atrObj);
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