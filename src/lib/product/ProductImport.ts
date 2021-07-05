import { ProductSelector } from '../selector/ProductSelector';
import { Resource } from './Resource';
import { Product } from './Product';
import { Attribute } from './Attribute';
import { AttributeSet } from './AttributeSet';
import { ProvisioningPlan } from './ProvisioningPlan';
import { ProvisioningTask } from './ProvisioningTask';
import { Charge } from './Charge';
import { Pricebook } from './Pricebook';
import { Category } from './Category';
import { PriceRule } from './PriceRule';
import { PriceRuleAction } from "./PriceRuleAction";
import { PriceRuleCondition } from "./PriceRuleCondition";
import { FileManager } from '../file/FileManager';
import { Connection } from "@salesforce/core";
import { Upsert } from '../repository/Upsert';
import { Util } from '../Util';
import {Query} from "../selector/Query";

export class ProductImport {

    private productIds:Array<String>;
    private resourceIds:Array<String>;
    private attributeIds:Array<String>;
    private categoryIds:Array<String>;
    private attributeSetIds:Array<String>;
    private provisioningPlanIds:Array<String>;
    private provisioningTaskIds:Array<String>;
    private chargeIds:Array<String>;

    private products:Array<Product>;
    private resources:Array<Resource>;
    private attributes:Array<Attribute>;
    private attributeSets:Array<AttributeSet>;
    private provisioningPlans:Array<ProvisioningPlan>;
    private provisioningTasks:Array<ProvisioningTask>;
    private charges:Array<Charge>;
    private categories:Array<Category>;
    private pricebooks:Array<Pricebook>;
    private priceRules:Array<PriceRule>;
    private priceRuleConditions:Array<PriceRuleCondition>;
    private priceRuleActions:Array<PriceRuleAction>;

    private targetDirectory:string;
    private exportB2BObjects: boolean;
    private connection:Connection;
    private fileManager:FileManager;

    constructor(targetDirectory:string, connection: Connection, exportB2BObjects: boolean) {
        this.targetDirectory = targetDirectory;
        this.exportB2BObjects = exportB2BObjects;
        this.fileManager = new FileManager(targetDirectory);
        this.connection = connection;
    }

    public async import(productNames: Array<string>,
                        currencyNames: Set<String>) {

        await this.setProductImportScope(productNames);
        await this.setResourceImportScope();
        await this.setAttributeSetImportScope();
        await this.setCategoryImportScope();
        await this.setAttributeImportScope();
        await this.setParentCategoryImportScope();
        await this.setChargeImportScope();
        await this.setPricebookImportScope();
        await this.setPriceRuleImportScope();

        if (this.exportB2BObjects) {
            await this.setProvisioningPlanImportScope();
            await this.setProvisioningTaskImportScope();
            await this.setProvisioningTaskOwnership();
        }

        const productSelector = new ProductSelector(this.exportB2BObjects);
        const recordTypes = await productSelector.getRecordTypes(this.connection);

        await Upsert.disableTriggers(this.connection);

        // -- attribute sets import begin
        if (this.attributeSetIds.length > 0) {
            const allAttributeSets = this.attributeSets.map((a) => {return a.record});
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allAttributeSets), 'enxCPQ__AttributeSet__c');
        }
        // -- attribute sets import end


        // -- categories import begin
        if (this.categoryIds.length > 0 && this.categories.length > 0) {
            const allCategories =  this.categories.map((c) => {return c.record});
            const allCategoriesWithoutRelationships = Util.sanitizeDeepForUpsert(allCategories);

            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allCategoriesWithoutRelationships), 'enxCPQ__Category__c');
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allCategories), 'enxCPQ__Category__c');
        }
        // -- categories import end


        // -- attributes import begin
        if (this.attributeIds.length > 0) {
            const allAttributes = this.attributes.map((a) => {return a.record});
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allAttributes), 'enxCPQ__Attribute__c');
        }
        // -- attributes import end

        // -- resources import begin
      if (this.resources.length) {
        const recordTypeId = recordTypes.filter(e => e.Object === 'Product2').find(e => e.DeveloperName === 'Resource').id;
        this.resources.forEach(res => {
            res.record.RecordTypeId = recordTypeId;
        })
            const allResources = this.resources.map((a) => {return a.record});
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allResources), 'Product2', 'Resource Product2 Objects');
        }
        // -- resources import end

        // -- products import begin
        if (this.productIds.length > 0) {
            let allProducts = [];
            this.products.forEach(product => { allProducts = [...allProducts, ... product.getProducts()] });
            const allProductsRTfix = Util.fixRecordTypes(allProducts, recordTypes, 'Product2');
            const allProductsWithoutRelationships = Util.sanitizeDeepForUpsert(allProductsRTfix);

            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allProductsWithoutRelationships), 'Product2', 'Products with no relationship');
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allProductsRTfix), 'Product2', 'Products with relationship');
        }
        // -- products import end

        // -- Resource Products import begin
        let allProductResources = [];
        this.products.forEach((product) => {
            if(product.resources.length > 0) allProductResources.push(...product.resources);
        });
        // @TO-DO handle array > 200 items
        if (allProductResources.length > 0)
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allProductResources), 'enxCPQ__ProductResource__c', 'Product Resource Objects');
        // -- Resource Products import end

        // -- attributes values import begin
        let allAttributeValues = [];
        this.attributes.forEach((attr) => { allAttributeValues = [...allAttributeValues, ...attr.attributeValues] });
        this.products.forEach((prod) => { allAttributeValues = [...allAttributeValues, ...prod.attributeValues] });
        // @TO-DO handle array > 200 items
        if (allAttributeValues.length > 0) {
            let attrUniqueValues = [];
            allAttributeValues.forEach(attVal => {
                const dupl = attrUniqueValues.filter(elem => {
                    const jede = attVal.enxCPQ__TECH_External_Id__c;
                    const dwa = elem.enxCPQ__TECH_External_Id__c;
                    return elem.enxCPQ__TECH_External_Id__c === attVal.enxCPQ__TECH_External_Id__c;
                });
                if (dupl.length < 1) {
                    attrUniqueValues.push(attVal);
                }
            });
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(attrUniqueValues), 'enxCPQ__AttributeValue__c', 'Attribute Values');
        }
        // -- attributes values import end


        // -- attribute set attributes import begin
        if (this.attributeSetIds.length > 0) {
            let allSetAttributes = [];
            this.attributeSets.forEach(ast => { allSetAttributes = [...allSetAttributes, ... ast.setAttributes] });
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allSetAttributes), 'enxCPQ__AttributeSetAttribute__c');
        }
        // -- attribute set attributes import end


        // -- product attributes import begin
        const productAttributesTarget = await productSelector.getProductAttributeIds(this.connection, this.productIds);
        let allProductAttributes = [];
        this.products.forEach((prod) => { allProductAttributes = [...allProductAttributes, ...prod.productAttributes] });
        const allProductAttributesRTfix = Util.fixRecordTypes(allProductAttributes, recordTypes, 'enxCPQ__ProductAttribute__c');
        // @TO-DO handle array > 200 items
        if (productAttributesTarget.length > 0)
            await Upsert.deleteData(this.connection, productAttributesTarget, 'enxCPQ__ProductAttribute__c');
        if (allProductAttributesRTfix.length > 0)
            await Upsert.insertData(this.connection, Util.sanitizeForUpsert(allProductAttributesRTfix), 'enxCPQ__ProductAttribute__c');
        // -- product attributes import end


        // -- charges import begin
        if (this.chargeIds.length > 0) {
            const allCharges = this.charges.map((c) => {return c.record});
            const allChargesRTfix = Util.fixRecordTypes(allCharges, recordTypes, 'Product2');
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allChargesRTfix), 'Product2', 'Charge products');

            let allChargeItems = [];
            this.charges.forEach((charge) => { allChargeItems = [...allChargeItems, ...charge.chargeElements, ...charge.chargeTiers] });
            if (allChargeItems.length > 0) {
                const allChargeItemsRTfix = Util.fixRecordTypes(allChargeItems, recordTypes, 'Product2');
                await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allChargeItemsRTfix), 'Product2', 'Charge products');
            }
        }

        // -- products import after charges begin
        if (this.productIds.length > 0 && Upsert.reimportProduct2AfterCharges) {
            let allProducts = [];
            this.products.forEach(product => { allProducts = [...allProducts, ...product.getProducts()] });
            const allProductsRTfix = Util.fixRecordTypes(allProducts, recordTypes, 'Product2');
            const allProductsWithoutRelationships = Util.sanitizeDeepForUpsert(allProductsRTfix);

            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allProductsWithoutRelationships), 'Product2', 'Products again after charges');
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allProductsRTfix), 'Product2', 'Products again after charges');
        }
        // -- products import after charges begin

        // -- pricebooks import begin
        const allPricebooks = this.pricebooks.filter((p) => { return p.isStandard !== true; })
                                             .map((p) => {return p.record});
        await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allPricebooks), 'Pricebook2');

        let pricebookEntryProductIds = [];
        this.products.forEach(product => { pricebookEntryProductIds = [... pricebookEntryProductIds, ...product.getAllProductIds()] });
        this.charges.forEach(charge => { pricebookEntryProductIds = [... pricebookEntryProductIds, ...charge.getAllProductIds()] });
        const pricebook2TargetIds = await productSelector.getPricebookIds(this.connection);
        const product2TargetIds = await productSelector.getProductIds(this.connection, pricebookEntryProductIds);

        let standardPricebookEntries = [];
        let pricebookEntries = [];

        this.pricebooks.forEach((pbook) => {
            standardPricebookEntries = [... standardPricebookEntries, ...pbook.getStandardPricebookEntriesToInsert(product2TargetIds, pricebook2TargetIds)];
            pricebookEntries = [... pricebookEntries, ...pbook.getPricebookEntriesToInsert(product2TargetIds, pricebook2TargetIds)];
        })

        let stdPricebookEntriesTarget = [];
        let pricebookEntriesTarget = [];

        if (pricebookEntryProductIds.length > 0) {
            stdPricebookEntriesTarget = await productSelector.getStandardPricebookEntryIds(this.connection, pricebookEntryProductIds);
            pricebookEntriesTarget = await productSelector.getPricebookEntryIds(this.connection, pricebookEntryProductIds);
        }

        const stdPricebookEntriesResult = this.mapPricebookEntries(stdPricebookEntriesTarget, standardPricebookEntries);
        const pricebookEntriesResult = this.mapPricebookEntries(pricebookEntriesTarget, pricebookEntries);

        if (pricebookEntriesResult.toDelete.length > 0)
            await Upsert.deleteData(this.connection, pricebookEntriesResult.toDelete, 'PricebookEntry');
        if (stdPricebookEntriesResult.toDelete.length > 0)
            await Upsert.deleteData(this.connection, stdPricebookEntriesResult.toDelete, 'PricebookEntry');

        if (stdPricebookEntriesResult.toUpdate.length > 0) {
            await Upsert.updateData(this.connection, stdPricebookEntriesResult.toUpdate, 'PricebookEntry');
        }
        if (pricebookEntriesResult.toUpdate.length > 0)
            await Upsert.updateData(this.connection, pricebookEntriesResult.toUpdate, 'PricebookEntry');

        if (stdPricebookEntriesResult.toInsert.length > 0)
            await Upsert.insertData(this.connection, stdPricebookEntriesResult.toInsert, 'PricebookEntry');
        if (pricebookEntriesResult.toInsert.length > 0)
            await Upsert.insertData(this.connection, pricebookEntriesResult.toInsert, 'PricebookEntry');
        // -- pricebooks import end


        // -- product relationships import begin
        let allProductRelationships = [];
        this.products.forEach((prod) => { allProductRelationships = [...allProductRelationships, ...prod.productRelationships] });
        if (allProductRelationships.length > 0)
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allProductRelationships), 'enxCPQ__ProductRelationship__c');
        // -- product relationships import end


        // -- bundle elements import begin
        // @TO-DO - this doesn't handle removal of bundle elements
        let allBundleElements = [];
        this.products.forEach((prod) => { allBundleElements = [...allBundleElements, ...prod.bundleElements] });
        if (allBundleElements.length > 0)
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allBundleElements), 'enxCPQ__BundleElement__c');
        // -- bundle elements import end


        // -- bundle element options import begin
        // @TO-DO - this doesn't handle removal of bundle element options
        let allBundleElementOptions = [];
        this.products.forEach((prod) => { allBundleElementOptions = [...allBundleElementOptions, ...prod.bundleElementOptions] });
        if (allBundleElementOptions.length > 0)
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allBundleElementOptions), 'enxCPQ__BundleElementOption__c');
        // -- bundle element options import end


        // -- attribute rules import begin
        let allAttributeRules = [];
        this.products.forEach((prod) => { allAttributeRules = [...allAttributeRules, ...prod.attributeRules] });
        const allAttributeRulesRTfix = Util.fixRecordTypes(allAttributeRules, recordTypes, 'enxCPQ__AttributeRule__c');
        if (allAttributeRulesRTfix.length > 0)
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allAttributeRulesRTfix), 'enxCPQ__AttributeRule__c');
        // -- attribute rules import end


        // -- attribute default values import begin
        let allAttributeDefaultValues = [];
        this.products.forEach((prod) => { allAttributeDefaultValues = [...allAttributeDefaultValues, ...prod.attributeDefaultValues] });
        if (allAttributeDefaultValues.length > 0)
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allAttributeDefaultValues), 'enxCPQ__AttributeDefaultValue__c');
        // -- attribute default values import end


        // -- attribute value dependencies import begin
        let allAttributeValueDependencies = [];
        this.products.forEach((prod) => { allAttributeValueDependencies = [...allAttributeValueDependencies, ...prod.attributeValueDependencies] });
        if (allAttributeValueDependencies.length > 0)
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allAttributeValueDependencies), 'enxCPQ__AttributeValueDependency__c');
        // -- attribute value dependencies import end


        // -- provisioning tasks import begin
        if (this.provisioningTaskIds && this.provisioningTaskIds.length > 0) {
            const allProvisioningTasks =  this.provisioningTasks.map((task) => {return task.record});
            const allProvisioningTasksRTfix = Util.fixRecordTypes(allProvisioningTasks, recordTypes, 'enxB2B__ProvisioningTask__c');
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allProvisioningTasksRTfix), 'enxB2B__ProvisioningTask__c');
        }
        // -- provisioning tasks import end


        // -- provisioning plans import begin
        if (this.provisioningPlanIds && this.provisioningPlanIds.length > 0) {
            const allProvisioningPlans =  this.provisioningPlans.map((plan) => {return plan.record});
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allProvisioningPlans), 'enxB2B__ProvisioningPlan__c');

            const provisioningTaskAssignmentsTarget = await productSelector.getProvisioningTaskAssignmentIds(this.connection, this.provisioningPlanIds);
            let allProvisioningTaskAssignments = [];
            this.provisioningPlans.forEach(plan => { allProvisioningTaskAssignments = [...allProvisioningTaskAssignments, ... plan.provisioningTasks] });
            if (provisioningTaskAssignmentsTarget.length > 0)
                await Upsert.deleteData(this.connection, provisioningTaskAssignmentsTarget, 'enxB2B__ProvisioningTaskAssignment__c');
            if (allProvisioningTaskAssignments.length > 0)
                await Upsert.insertData(this.connection, Util.sanitizeForUpsert(allProvisioningTaskAssignments), 'enxB2B__ProvisioningTaskAssignment__c');

            const provisioningPlanAssignmentsTarget = await productSelector.getProductProvisioningPlanIds(this.connection, this.productIds);
            let allProvisioningPlanAssignments = [];
            this.products.forEach(product => { allProvisioningPlanAssignments = [...allProvisioningPlanAssignments, ... product.provisioningPlans] });
            if (provisioningPlanAssignmentsTarget.length > 0)
                await Upsert.deleteData(this.connection, provisioningPlanAssignmentsTarget, 'enxB2B__ProvisioningPlanAssignment__c');
            if (allProvisioningPlanAssignments.length > 0)
                await Upsert.insertData(this.connection, Util.sanitizeForUpsert(allProvisioningPlanAssignments), 'enxB2B__ProvisioningPlanAssignment__c');
        }
        // -- provisioning plans import end

        // -- price rules import begin
        if(this.priceRules && this.priceRules.length){
          const allPriceRules =  this.priceRules.map((priceRule) => {return priceRule.record});
          await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allPriceRules), 'enxCPQ__PriceRule__c');
          if(this.priceRuleConditions && this.priceRuleConditions.length){
            const allPriceRuleConditions =  this.priceRuleConditions.map((prc) => {return prc.record});
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allPriceRuleConditions), 'enxCPQ__PriceRuleCondition__c');
          }
          if(this.priceRuleActions && this.priceRuleActions.length){
            const allPriceRuleActions =  this.priceRuleActions.map((prc) => {return prc.record});
            await Upsert.upsertData(this.connection, Util.sanitizeForUpsert(allPriceRuleActions), 'enxCPQ__PriceRuleAction__c');
          }
        }
        // -- price rules import end

        await Upsert.enableTriggers(this.connection);
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
                                                            return productToImportNames.includes(elem.substring(0, elem.indexOf('_PRD'))) ||
                                                                   productToImportNames.includes(elem.substring(0, elem.indexOf('_BDL')));
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

                if(prodObj.options !== undefined && prodObj.options.length > 0){
                    prodObj.options.forEach(option => {
                        if(option.optionResources !== undefined && option.optionResources.length > 0){
                            prodObj.resources.push(...option.optionResources);
                        }
                    });
                }
                this.products.push(prodObj);
                this.productIds.push(prodObj.getProductId());
            });

            if (this.productIds.length === 0) {
                Util.throwError('Nothing to import');
            }
        })
    }

    private async setResourceImportScope() {
        this.resourceIds = [];
        this.resources = [];

        this.products.forEach(product => {
            this.resourceIds = [...this.resourceIds, ...new Set(product.getProductResourceIds())];
        });

        const allResourceFileNames = await this.fileManager.readAllFileNames('resources');

        let resourceJSONArray = [];
        allResourceFileNames.forEach((fileName) => {
            const attributeInputReader = this.fileManager.readFile('resources', fileName);
            resourceJSONArray.push(attributeInputReader);
        });

        return Promise.all(resourceJSONArray).then((values) => {
            const resourceJSONs = values;

            resourceJSONs.forEach((atr) => {
                const atrObj:Resource = new Resource(null);
                atrObj.fillFromJSON(atr);

                this.resources.push(atrObj);
            });
        });
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

        this.resources.forEach((product) => {
            const categoryId = product.getCategoryId();
            if (categoryId !== null) this.categoryIds.push(categoryId);
        });

        const allCategoryFileNames = await this.fileManager.readAllFileNames('categories');

        if(allCategoryFileNames && allCategoryFileNames.length > 0) {
            const categoryFileNames = allCategoryFileNames.filter((elem) => {
                const fileNameId = elem.substring(elem.indexOf('_CAT')+1, elem.indexOf('.json'));
                return this.categoryIds.includes(fileNameId);
            });

            let categoryJSONArray = [];
            categoryFileNames.forEach((fileName) => {
                const categoryInputReader = this.fileManager.readFile('categories', fileName);
                categoryJSONArray.push(categoryInputReader);
            });

            return Promise.all(categoryJSONArray)
                .then((values) => {
                    const categoryJSONs = values;

                    categoryJSONs.forEach((cat) => {
                        const catObj:Category = new Category(null);
                        catObj.fillFromJSON(cat);

                        this.categories.push(catObj);
                    });
                })
                .catch((function(error){
                    Util.log(error);
                }));
        }
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

            await Promise.all(categoryJSONArray)
            .then((values) => {
                const categoryJSONs = values;

                if(categoryJSONs.length > 0){
                    categoryJSONs.forEach((cat) => {
                        const catObj:Category = new Category(null);
                        catObj.fillFromJSON(cat);

                        this.categories.push(catObj);
                    });
                }
            })
            .catch(function(error){
                console.log('Unexpected error in setParentCategoryImportScope():: ' + error);
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

    private async setChargeImportScope() {
        this.chargeIds = [];
        this.charges = [];

        this.products.forEach(product => {
            this.chargeIds = [...this.chargeIds, ...new Set(product.getChargeIds())];
        });

        this.resources.forEach(resource => {
          this.chargeIds = [...this.chargeIds, ...new Set(resource.getChargeIds())];
        });

        if (this.chargeIds.length > 0) {
            const allChargeFileNames = await this.fileManager.readAllFileNames('charges');

            const chargeFileNames = allChargeFileNames.filter((elem) => {
                const fileNameId = elem.substring(elem.indexOf('_PRD')+1, elem.indexOf('.json'));
                return this.chargeIds.includes(fileNameId);
            });

            let chargeJSONArray = [];
            chargeFileNames.forEach((fileName) => {
                const chargeInputReader = this.fileManager.readFile('charges', fileName);
                chargeJSONArray.push(chargeInputReader);
            });

            return Promise.all(chargeJSONArray).then((values) => {
                const chargeJSONs = values;

                chargeJSONs.forEach((chrg) => {
                    const chrgObj:Charge = new Charge(null);
                    chrgObj.fillFromJSON(chrg);

                    this.charges.push(chrgObj);
                });
            });
        }
    }

    private async setPricebookImportScope() {
        this.pricebooks = [];

        const pricebookFileNames = await this.fileManager.readAllFileNames('priceBooks');

        let pricebookJSONArray = [];
        pricebookFileNames.forEach((fileName) => {
            const pricebookInputReader = this.fileManager.readFile('priceBooks', fileName);
            pricebookJSONArray.push(pricebookInputReader);
        });

        return Promise.all(pricebookJSONArray).then((values) => {
            const pricebookJSONs = values;

            pricebookJSONs.forEach((pbook) => {
                const pbookObj:Pricebook = new Pricebook(null);
                pbookObj.fillFromJSON(pbook);
                this.pricebooks.push(pbookObj);
            });
        });
    }

  private async setPriceRuleImportScope() {
    this.priceRules = [];
    this.priceRuleConditions = [];
    this.priceRuleActions = [];

    const priceRuleFileNames = await this.fileManager.readAllFileNames('priceRules');

    let priceRuleJSONArray = [];
    priceRuleFileNames.forEach((fileName) => {
      const priceRuleInputReader = this.fileManager.readFile('priceRules', fileName);
      priceRuleJSONArray.push(priceRuleInputReader);
    });

    return Promise.all(priceRuleJSONArray).then((values) => {
      const priceRuleJSONs = values;

      priceRuleJSONs.forEach((pRule) => {
        const pRuleObj:PriceRule = new PriceRule(null);
        pRuleObj.fillFromJSON(pRule);
        this.priceRules.push(pRuleObj);
        this.priceRuleConditions = [...this.priceRuleConditions, ...pRuleObj.priceRuleCondition];
        this.priceRuleActions = [...this.priceRuleActions, ...pRuleObj.priceRuleAction];
      });
    });
  }

    private async setProvisioningPlanImportScope() {
        this.provisioningPlanIds = [];
        this.provisioningPlans = [];

        this.products.forEach(product => {
            this.provisioningPlanIds = [...this.provisioningPlanIds, ...new Set(product.getProvisioningPlanIds())];
        });

        if (this.provisioningPlanIds.length > 0) {
            const allProvisioningPlanFileNames = await this.fileManager.readAllFileNames('provisioningPlans');

            const provisioningPlanFileNames = allProvisioningPlanFileNames.filter((elem) => {
                const fileNameId = elem.substring(elem.indexOf('_PPL')+1, elem.indexOf('.json'));
                return this.provisioningPlanIds.includes(fileNameId);
            });

            let provisioningPlanJSONArray = [];
            provisioningPlanFileNames.forEach((fileName) => {
                const provisioningPlanInputReader = this.fileManager.readFile('provisioningPlans', fileName);
                provisioningPlanJSONArray.push(provisioningPlanInputReader);
            });

            return Promise.all(provisioningPlanJSONArray).then((values) => {
                const provisioningPlanJSONs = values;

                provisioningPlanJSONs.forEach((ppl) => {
                    const pplObj:ProvisioningPlan = new ProvisioningPlan(null);
                    pplObj.fillFromJSON(ppl);

                    this.provisioningPlans.push(pplObj);
                });
            });
        }
    }

    private async setProvisioningTaskImportScope() {
        this.provisioningTaskIds = [];
        this.provisioningTasks = [];

        this.provisioningPlans.forEach(plan => {
            this.provisioningTaskIds = [...this.provisioningTaskIds, ...new Set(plan.getProvisioningTaskIds())];
        });

        if (this.provisioningTaskIds.length > 0) {
            const allProvisioningTaskFileNames = await this.fileManager.readAllFileNames('provisioningTasks');

            const provisioningTaskFileNames = allProvisioningTaskFileNames.filter((elem) => {
                const fileNameId = elem.substring(elem.indexOf('_PTS')+1, elem.indexOf('.json'));
                return this.provisioningTaskIds.includes(fileNameId);
            });

            let provisioningTaskJSONArray = [];
            provisioningTaskFileNames.forEach((fileName) => {
                const provisioningTaskInputReader = this.fileManager.readFile('provisioningTasks', fileName);
                provisioningTaskJSONArray.push(provisioningTaskInputReader);
            });

            return Promise.all(provisioningTaskJSONArray).then((values) => {
                const provisioningTaskJSONs = values;

                provisioningTaskJSONs.forEach((ptsk) => {
                    const ptskObj:ProvisioningTask = new ProvisioningTask(null);
                    ptskObj.fillFromJSON(ptsk);

                    this.provisioningTasks.push(ptskObj);
                });
            });
        }
    }

    private async setProvisioningTaskOwnership(){
      let userIdEmails = new Map(); //key is email, value is list of IDs
      let queueIdName = new Map(); //key is queue name, value is ID
      let userEmails = new Set();
      let queueNames = new Set();
      this.provisioningTasks.forEach(task => {
        if(task.record.OwnerEmail){
          userEmails.add(task.record.OwnerEmail);
        } else if(task.record.OwnerQueue){
          queueNames.add(task.record.OwnerQueue);
        }
      });
      const queryUser = "SELECT Id, Email FROM User WHERE Email IN ('" + Array.from(userEmails).join('\',\'') + "')";
      const queryQueue = "SELECT Id, Name FROM Group WHERE Type = 'Queue' AND Name IN ('" + Array.from(queueNames).join('\',\'') + "')";
      const users = await Query.executeQuery(this.connection, queryUser, 'provisioning task user owner');
      const queues = await Query.executeQuery(this.connection, queryQueue, 'provisioning task queue owner');
      users.forEach( (u) => {
        // @ts-ignore-start
        if(userIdEmails.get(u.Email)){
          // @ts-ignore
          let listOfIds = userIdEmails.get(u.Email);
          // @ts-ignore
          listOfIds.push(u.Id);
          // @ts-ignore
          userIdEmails.set(u.Email, listOfIds);
        } else {
          // @ts-ignore
          userIdEmails.set(u.Email, [u.Id]);
        }
      });
      queues.forEach( (q) => {
        // @ts-ignore
        queueIdName.set(q.Name, q.Id);
      });
      for(let task of this.provisioningTasks){
        if(task.record.OwnerEmail){
          if(userIdEmails.get(task.record.OwnerEmail) && userIdEmails.get(task.record.OwnerEmail).length === 1){
            task.record.OwnerId = userIdEmails.get(task.record.OwnerEmail)[0];
          } else{
            // if there is more than one user with owner email system should set owner to system administrator what is default behaviour and ownerId is not needed
            delete task.record.OwnerId;
          }
          delete task.record.OwnerEmail;
        } else if(task.record.OwnerQueue){
          if(queueIdName.get(task.record.OwnerQueue)){
            task.record.OwnerId = queueIdName.get(task.record.OwnerQueue);
          } else {
            // if queue name doesnt exist on target org than system should set owner to system administrator
            delete task.record.OwnerId;
          }
          delete task.record.OwnerQueue;
        }
      }
    }

    private async getAllProductsLocal() {
        const productFileNames = await this.fileManager.readAllFileNames('products');
        return productFileNames;
    }

    private mapPricebookEntries(target:Array<any>, source:Array<any>) {
        let result = {
                toInsert: [],
                toUpdate: [],
                toDelete: []
            };

        source.forEach((sourceElement) => {
            const targetElementIndex = target.findIndex(e => { return e['Product2Id'] === sourceElement['Product2Id'] &&
                                                                      e['CurrencyIsoCode'] === sourceElement['CurrencyIsoCode'] &&
                                                                      e['Pricebook2Id'] === sourceElement['Pricebook2Id']; });

            if (targetElementIndex !== -1) {
                const targetElement = target.splice(targetElementIndex, 1)[0];
                sourceElement['Id'] = targetElement['Id'];
                delete sourceElement['Product2Id'];
                delete sourceElement['Pricebook2Id'];
                delete sourceElement['CurrencyIsoCode'];
                result.toUpdate.push(sourceElement);
            } else {
                result.toInsert.push(sourceElement);
            }
        })

        result.toDelete = [... target];

        return result;
    }

}
