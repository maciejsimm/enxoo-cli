import { ProductSelector } from '../selector/ProductSelector';
import { Product } from './Product';
import { Attribute } from './Attribute';
import { Resource } from './Resource';
import { PriceRule } from "./PriceRule";
import { PriceRuleAction } from "./PriceRuleAction";
import { PriceRuleCondition } from "./PriceRuleCondition";
import { AttributeSet } from './AttributeSet';
import { ProvisioningPlan } from './ProvisioningPlan';
import { ProvisioningTask } from './ProvisioningTask';
import { Charge } from './Charge';
import { Category } from './Category';
import { Pricebook } from './Pricebook';
import { FileManager } from '../file/FileManager';
import { Connection } from "@salesforce/core";
import { Util } from '../Util';
import * as fs from 'fs';

export class ProductExport {

    private productIds:Array<String>;
    private optionIds:Array<String>;
    private attributeIds:Array<String>;
    private categoryIds:Array<String>;
    private attributeSetIds:Array<String>;
    private provisioningPlanIds:Array<String>;
    private provisioningTaskIds:Array<String>;
    private chargeIds:Array<String>;
    private priceRuleIds:Array<String>;

    private products:Array<Product>;
    private resources:Array<Resource>;
    private attributeLocalValues:Array<any>;
    private attributes:Array<Attribute>;
    private attributeSets:Array<AttributeSet>;
    private provisioningPlans:Array<ProvisioningPlan>;
    private provisioningTasks:Array<ProvisioningTask>;
    private charges:Array<Charge>;
    private categories:Array<Category>;
    private pricebooks:Array<Pricebook>;
    private priceRules:Array<PriceRule>;

    private productNames:Array<string>;
    private targetDirectory:string;
    private exportB2BObjects:boolean;
    private connection:Connection;
    private fileManager:FileManager;

    constructor(targetDirectory:string, connection: Connection, exportB2BObjects: boolean) {
        this.targetDirectory = targetDirectory;
        this.exportB2BObjects = exportB2BObjects;
        this.fileManager = new FileManager(targetDirectory, exportB2BObjects);
        this.connection = connection;
    }

    public async export(productNames: Array<string>,
                        exportRelationships: Boolean,
                        currencyNames: Set<String>) {

        const querySettings = await this.fileManager.loadQueryConfiguration(this.targetDirectory);
        const queryFields = await this.loadQueryFields(this.targetDirectory);
        this.productNames = productNames;
        const productSelector = new ProductSelector(this.exportB2BObjects, querySettings, queryFields);

        const allProducts = await this.getAllProducts(productSelector);
        this.setProductExportScope(productNames, allProducts);

        if (exportRelationships) {
            const relatedProductList = await productSelector.getAllRelatedProducts(this.connection, this.productIds);
            this.extendProductExportScope(relatedProductList);
        }

        this.fileManager.createDirectoriesForExport();

        // -- products export begin
        const products = await productSelector.getProducts(this.connection, this.productIds);
        this.wrapProducts(products);

        const productOptions = await productSelector.getProductOptions(this.connection, this.productIds);
        this.wrapProductOptions(productOptions);

        // -- resources export begin
        const allResourceProductIds = [...this.productIds, ...this.optionIds];
        let resourceIds = [];
        const productResourceJunctions =  await productSelector.getResourceJunctionObjects(this.connection, allResourceProductIds);
        if(productResourceJunctions){
          const resourceProducts = await productSelector.getProductsWithResourceRecordType(this.connection, productResourceJunctions);
          for (let resourceProduct of resourceProducts) {
            resourceIds.push(resourceProduct['enxCPQ__TECH_External_Id__c']);
          }
          const unrelatedResources = await productSelector.getUnrelatedResources(this.connection);
          for (let resourceProduct of unrelatedResources) {
            resourceIds.push(resourceProduct['enxCPQ__TECH_External_Id__c']);
          }
          this.wrapProductResources(resourceProducts, productResourceJunctions);
          this.wrapUnrelatedResources(unrelatedResources);
        }
        const allIdsToRetrieveCharges = [...this.productIds, ...resourceIds];
        const charges = await productSelector.getCharges(this.connection, allIdsToRetrieveCharges);
        this.wrapProductCharges(charges);

        const productAttributes = await productSelector.getProductAttributes(this.connection, this.productIds);
        this.wrapProductAttributes(productAttributes);

        const localAttributeValues = await productSelector.getLocalAttributeValues(this.connection, this.productIds);
        this.wrapAttributeValues(localAttributeValues);

        const attributeRules = await productSelector.getAttributeRules(this.connection, this.productIds);
        this.wrapAttributeRules(attributeRules);

        const productRelationships = await productSelector.getProductRelationships(this.connection, this.productIds);
        this.wrapProductRelationships(productRelationships);

        const attributeDefaultValues = await productSelector.getAttributeDefaultValues(this.connection, this.productIds);
        this.wrapAttributeDefaultValues(attributeDefaultValues);

        const attributeValueDependencies = await productSelector.getAttributeValueDependencies(this.connection, this.productIds);
        this.wrapAttributeValueDependencies(attributeValueDependencies);

        const bundleElements = await productSelector.getBundleElements(this.connection, this.productIds);
        this.wrapBundleElements(bundleElements);

        let bundleElementIds = [];
        this.products.forEach(product => { bundleElementIds = [...bundleElementIds, ...product.getBundleElementIds()] });
        const bundleElementOptions = await productSelector.getBundleElementOptions(this.connection, bundleElementIds);
        this.wrapBundleElementOptions(bundleElementOptions);

        if (this.exportB2BObjects) {
            const productProvisioningPlans = await productSelector.getProductProvisioningPlans(this.connection, this.productIds);
            this.wrapProductProvisioningPlans(productProvisioningPlans);
        }
        // -- products export end


        // -- categories begin
        this.categoryIds = [];
        this.products.forEach(product => { if (product.getCategoryId() != null) this.categoryIds.push(product.getCategoryId()) });
        this.resources.forEach(product => { if (product.getCategoryId() != null) this.categoryIds.push(product.getCategoryId()) });

        const categories = await productSelector.getCategories(this.connection, this.categoryIds);
        this.wrapCategories(categories);

        // when exporting categories we need to get parent (and parent) categories as well
        let allCategoriesExported = false;

        while (!allCategoriesExported) {
            let parentCategoryIds = [];
            this.categories.forEach((cat) => {
                const parentCategoryId = cat.getParentCategory();
                if (parentCategoryId !== null && !this.categoryIds.includes(parentCategoryId)) {
                    this.categoryIds.push(parentCategoryId);
                    parentCategoryIds.push(parentCategoryId);
                }
            });

            if (parentCategoryIds.length === 0) {
                allCategoriesExported = true;
            } else {
                const parentCategories = await productSelector.getCategories(this.connection, parentCategoryIds);
                this.wrapCategories(parentCategories);
            }
        }
        // -- categories end


        // -- attributes begin
        this.attributeIds = [];
        this.products.forEach(product => { this.attributeIds = [...this.attributeIds, ...product.getAttributeIds()] });

        const attributes = await productSelector.getAttributeDefinitions(this.connection, this.attributeIds);
        this.wrapAttributes(attributes);

        const globalAttributeValues = await productSelector.getGlobalAttributeValues(this.connection, this.attributeIds);
        this.wrapGlobalAttributeValues(globalAttributeValues);
        // -- attributes end


        // -- attribute sets begin
        this.attributeSetIds = [];
        this.products.forEach(product => { this.attributeSetIds = [...this.attributeSetIds, ...new Set(product.getAttributeSetIds())] });

        const attributeSets = await productSelector.getAttributeSets(this.connection, this.attributeSetIds);
        this.wrapAttributeSets(attributeSets);

        const attributeSetAttributes = await productSelector.getAttributeSetAttributes(this.connection, this.attributeSetIds);
        this.wrapAttributeSetAttributes(attributeSetAttributes);
        // -- attribute sets end


        // -- charges begin
        this.chargeIds = [];
        this.products.forEach(product => { this.chargeIds = [...this.chargeIds, ...product.getChargeIds()] });
        this.resources.forEach(resource => { this.chargeIds = [...this.chargeIds, ...resource.getChargeIds()] });

        const chargeDefinitions = await productSelector.getChargeDefinitions(this.connection, this.chargeIds);
        this.wrapChargeDefinitions(chargeDefinitions);

        const chargeElements = await productSelector.getChargeElements(this.connection, this.chargeIds);
        this.wrapChargeElements(chargeElements);

        const chargeTiers = await productSelector.getChargeTiers(this.connection, this.chargeIds);
        this.wrapChargeTiers(chargeTiers);
        // -- charges end


        // -- pricebooks begin
        this.loadPricebooks();
        const pricebooks = await productSelector.getPricebooks(this.connection);
        this.wrapPricebooks(pricebooks);

        let pricebooksIds = [];
        this.pricebooks.forEach(pbook => { pricebooksIds = [... pricebooksIds, pbook.getPricebookId()] })

        let pricebookEntryProductIds = [];
        this.products.forEach(product => { pricebookEntryProductIds = [... pricebookEntryProductIds, ...product.getAllProductIds()] });
        this.charges.forEach(charge => { pricebookEntryProductIds = [... pricebookEntryProductIds, ...charge.getAllProductIds()] });

        // @TO-DO bulk query should be made here
        let allStandardEntries = [];
        let iterator = Math.ceil(pricebookEntryProductIds.length / 5000) * 5000;
        for (let i = 0; i < iterator; i = i + 5000) {
            const temp = pricebookEntryProductIds.slice(i, i + 4999);
            const standardPricebookEntries = await productSelector.getStandardPricebookEntries(this.connection, temp);
            allStandardEntries.push(...standardPricebookEntries);
        }
        this.wrapStandardPricebookEntries(allStandardEntries);

        let allNonStandardPricebookEntries = [];
        iterator = Math.ceil(pricebookEntryProductIds.length / 5000) * 5000;
        for (let i = 0; i < iterator; i = i + 5000) {
            const temp = pricebookEntryProductIds.slice(i, i + 4999);
            const nonStandardPricebookEntries = await productSelector.getPricebookEntries(this.connection, temp, pricebooksIds);
            allNonStandardPricebookEntries.push(...nonStandardPricebookEntries);
        }
        this.wrapPricebookEntries(allNonStandardPricebookEntries);
        // -- pricebooks end


        // -- provisioning plans begin
        if (this.exportB2BObjects) {
            this.provisioningPlanIds = [];
            this.products.forEach(product => { this.provisioningPlanIds = [... this.provisioningPlanIds, ...new Set(product.getProvisioningPlanIds())] });

            const provisioningPlans = await productSelector.getProvisioningPlans(this.connection, this.provisioningPlanIds);
            this.wrapProvisioningPlans(provisioningPlans);

            const provisioningTaskAssignments = await productSelector.getProvisioningTaskAssignments(this.connection, this.provisioningPlanIds);
            this.wrapProvisioningTaskAssignments(provisioningTaskAssignments);

            this.provisioningTaskIds = [];
            this.provisioningPlans.forEach(plan => { this.provisioningTaskIds = [...this.provisioningTaskIds, ... new Set(plan.getProvisioningTaskIds())]});

            const provisioningTasks = await productSelector.getProvisioningTasks(this.connection, this.provisioningTaskIds);
            this.wrapProvisioningTasks(provisioningTasks);
        }
        // -- provisioning plans end

        // -- price rules begin
        this.priceRuleIds = [];
        this.priceRules = [];
        const priceRules = await productSelector.getPriceRules(this.connection, this.productIds);
        this.wrapPriceRules(priceRules);

        const priceRuleConditions = await productSelector.getPriceRuleConditions(this.connection, this.priceRuleIds);
        this.wrapPriceRuleConditions(priceRuleConditions);

        const priceRuleActions = await productSelector.getPriceRuleActions(this.connection, this.priceRuleIds);
        this.wrapPriceRuleActions(priceRuleActions);
        // -- price rules end


        // -- saving files begin
        await this.products.forEach((product) => {
            this.fileManager.deleteOldFilesWithDifferentName('products', product.getFileName(), product.getProductId());
            this.fileManager.writeFile('products', product.getFileName(), product);
        });

        if(this.resources){
          await this.resources.forEach((resource) => {
            this.fileManager.deleteOldFilesWithDifferentName('resources', resource.getFileName(), resource.getRecordId());
            this.fileManager.writeFile('resources', resource.getFileName(), resource);
          });
        }

        await this.attributes.forEach((attribute) => {
            this.fileManager.deleteOldFilesWithDifferentName('attributes', attribute.getFileName(), attribute.getRecordId());
            this.fileManager.writeFile('attributes', attribute.getFileName(), attribute);
        });

        await this.charges.forEach((charge) => {
            this.fileManager.deleteOldFilesWithDifferentName('charges', charge.getFileName(), charge.getRecordId());
            this.fileManager.writeFile('charges', charge.getFileName(), charge);
        });

        await this.categories.forEach((category) => {
            this.fileManager.deleteOldFilesWithDifferentName('categories', category.getFileName(), category.getRecordId());
            this.fileManager.writeFile('categories', category.getFileName(), category);
        });

        await this.attributeSets.forEach((attributeSet) => {
            this.fileManager.deleteOldFilesWithDifferentName('attributeSets', attributeSet.getFileName(), attributeSet.getRecordId());
            this.fileManager.writeFile('attributeSets', attributeSet.getFileName(), attributeSet);
        });

        await this.pricebooks.forEach((pbook) => {
            this.fileManager.deleteOldFilesWithDifferentName('priceBooks', pbook.getFileName(), pbook.getPricebookId());
            this.fileManager.writeFile('priceBooks', pbook.getFileName(), pbook);
        });

        await this.priceRules.forEach((priceRule) => {
          this.fileManager.deleteOldFilesWithDifferentName('priceRules', priceRule.getFileName(), priceRule.getRecordId());
          this.fileManager.writeFile('priceRules', priceRule.getFileName(), priceRule);
        });

        if (this.exportB2BObjects) {
            await this.provisioningPlans.forEach((plan) => {
                this.fileManager.deleteOldFilesWithDifferentName('provisioningPlans', plan.getFileName(), plan.getRecordId());
                this.fileManager.writeFile('provisioningPlans', plan.getFileName(), plan);
            });

            await this.provisioningTasks.forEach((task) => {
                this.fileManager.deleteOldFilesWithDifferentName('provisioningTasks', task.getFileName(), task.getRecordId());
                this.fileManager.writeFile('provisioningTasks', task.getFileName(), task);
            });
        }
        // -- end saving files
    }

    private async getAllProducts(selector:ProductSelector) {
        const productList = await selector.getAllProducts(this.connection);
        const productNames = [...productList];
        return productNames;
    }

    private setProductExportScope(productToExportNames: Array<string>, allProducts: Array<any>) {
        if (productToExportNames[0] === '*ALL') {
            this.productIds = allProducts.map((p) => { return p.id; });
        } else {
            this.productIds = [];
            productToExportNames.forEach((name) => {
                const elem = allProducts.find(e => e.name === name);
                if (elem === undefined) {
                    Util.warn('Product named ' + name + ' not found in target environment. Skipping');
                } else {
                    this.productIds.push(elem.id);
                }
            });
        }

        if (this.productIds.length === 0) {
            Util.throwError('Nothing to export');
        }
    }

    private extendProductExportScope(additionalProducts: Array<any>) {
        let productNames = [];
        additionalProducts.forEach((p) => {
            if (!this.productIds.includes(p.id)) {
                this.productIds.push(p.id);
                productNames.push(`\n` + p.name);
            }
        })

        Util.log('-- Following related products will also be retrieved: ' + productNames);
    }

    private wrapProducts(products:Array<any>) {
        this.products = new Array<Product>();
        products.forEach((p) => {
            this.products.push(new Product(p));
        })
    }

    private wrapProductOptions(productOptions:Array<any>) {
        this.optionIds = [];
        productOptions.forEach((option) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === option['enxCPQ__Parent_Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.options.push(option);
                this.optionIds.push(option.enxCPQ__TECH_External_Id__c);
            }
        });
    }

    private wrapProductResources(productResources:Array<any>, productResourceJunctions:Array<any>) {
        this.resources = new Array<Resource>();

        productResourceJunctions.forEach((resource) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === resource['enxCPQ__Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.resources.push(resource);
            }
            const productsWithOption = this.products.filter(prd => prd.options !== undefined);
            productsWithOption.forEach(prdWithOption => {
                prdWithOption.options.forEach(option => {
                    if (option['enxCPQ__TECH_External_Id__c'] === resource['enxCPQ__Product__r']['enxCPQ__TECH_External_Id__c']){
                        option.optionResources = [];
                        option.optionResources.push(resource);
                    }
                })
            });

        });

        productResources.forEach((resource) => {
            this.resources.push(new Resource(resource));
        });
    }

    private wrapUnrelatedResources(unrelatedResources:Array<any>) {
        //In case of specific product, only the related resources are queried. In case of '*ALL', the unrelated resources are also queried.
        if (this.productNames[0] !== '*ALL') {
            return;
        }
        unrelatedResources.forEach((resource) => {
            this.resources.push(new Resource(resource));
        });
    }

    private wrapProductCharges(productCharges:Array<any>) {
        productCharges.forEach((charge) => {
          let product;
          let resource;
          if(charge['enxCPQ__Root_Product__r']){
            product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === charge['enxCPQ__Root_Product__r']['enxCPQ__TECH_External_Id__c']);
          }
          if(charge['enxCPQ__Charge_Parent__r']){
            resource = this.resources.find(e => e.record['enxCPQ__TECH_External_Id__c'] === charge['enxCPQ__Charge_Parent__r']['enxCPQ__TECH_External_Id__c']);
          }
          if (product !== undefined) {
            product.charges.push(charge);
          }
          if (resource !== undefined) {
            resource.charges.push(charge);
          }
        });
    }

    private wrapProductAttributes(productAttributes:Array<any>) {
        productAttributes.forEach((attr) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === attr['enxCPQ__Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.productAttributes.push(attr);
            }
        });
    }

    private wrapAttributeValues(productAttributeValues:Array<any>) {
        this.attributeLocalValues = productAttributeValues;
        productAttributeValues.forEach((ava) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === ava['enxCPQ__Exclusive_for_Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.attributeValues.push(ava);
                product.attributeValues.sort((a, b) => (a.Name > b.Name) ? 1 : -1);
            }
        });
    }

    private wrapAttributeRules(attributeRules:Array<any>) {
        attributeRules.forEach((arl) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === arl['enxCPQ__Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.attributeRules.push(arl);
            }
        });
    }

    private wrapProductRelationships(productRelationships:Array<any>) {
        productRelationships.forEach((arl) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === arl['enxCPQ__Primary_Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.productRelationships.push(arl);
            }
        });
    }

    private wrapAttributeDefaultValues(attributeDefaultValues:Array<any>) {
        attributeDefaultValues.forEach((adv) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === adv['enxCPQ__Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.attributeDefaultValues.push(adv);
            }
        });
    }

    private wrapAttributeValueDependencies(attributeValueDependencies:Array<any>) {
        attributeValueDependencies.forEach((avd) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === avd['enxCPQ__Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.attributeValueDependencies.push(avd);
            }
        });
    }

    private wrapBundleElements(bundleElements:Array<any>) {
        bundleElements.forEach((bel) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === bel['enxCPQ__Bundle__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.bundleElements.push(bel);
            }
        });
    }

    private wrapPriceRules(priceRules:Array<any>) {
      priceRules.forEach((pr) => {
        const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === pr['enxCPQ__Product__r']['enxCPQ__TECH_External_Id__c']);
        if (product !== undefined) {
          product.priceRules.push(pr);
        }
        this.priceRules.push(new PriceRule(pr));
        this.priceRuleIds.push(pr['enxCPQ__TECH_External_Id__c']);
      });
    }

    private wrapPriceRuleConditions(priceRuleConditions:Array<any>) {
      priceRuleConditions.forEach((prc) => {
        const priceRule = this.priceRules.find(e => e.record['enxCPQ__TECH_External_Id__c'] === prc['enxCPQ__Price_Rule__r']['enxCPQ__TECH_External_Id__c']);
        if (priceRule !== undefined) {
          priceRule.priceRuleCondition.push(new PriceRuleCondition(prc));
        }
      });
    }

    private wrapPriceRuleActions(priceRuleActions:Array<any>) {
      priceRuleActions.forEach((pra) => {
        const priceRule = this.priceRules.find(e => e.record['enxCPQ__TECH_External_Id__c'] === pra['enxCPQ__Price_Rule__r']['enxCPQ__TECH_External_Id__c']);
        if (priceRule !== undefined) {
          priceRule.priceRuleAction.push(new PriceRuleAction(pra));
        }
      });
    }

    private wrapBundleElementOptions(bundleElementOptions:Array<any>) {
        bundleElementOptions.forEach((bel) => {
            let product;
            for (let i = 0; i < this.products.length; i++) {
                if (this.products[i].bundleElements.length > 0) {
                    for (let j = 0; j < this.products[i].bundleElements.length; j++) {
                        const element = this.products[i].bundleElements[j];
                        if (bel['enxCPQ__Bundle_Element__r']['enxCPQ__TECH_External_Id__c'] == element['enxCPQ__TECH_External_Id__c']) {
                            product = this.products[i];
                            break;
                        }
                    }
                }
                if (product !== null && product !== undefined) break;
            }

            if (product !== null && product !== undefined) {
                product.bundleElementOptions.push(bel);
            }
        });
    }

    private wrapProductProvisioningPlans(provisioningPlans:Array<any>) {
        provisioningPlans.forEach((ppl) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === ppl['enxB2B__Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.provisioningPlans.push(ppl);
            }
        });
    }

    private wrapProvisioningPlans(plans:Array<any>) {
        this.provisioningPlans = new Array<ProvisioningPlan>();
        plans.forEach((plan) => {
            this.provisioningPlans.push(new ProvisioningPlan(plan));
        })
    }

    private wrapProvisioningTaskAssignments(provisioningTaskAssignments:Array<any>) {
        provisioningTaskAssignments.forEach((pta) => {
            const provisioningPlan = this.provisioningPlans.find(e => e.record['enxB2B__TECH_External_Id__c'] === pta['enxB2B__Provisioning_Plan__r']['enxB2B__TECH_External_Id__c']);
            if (provisioningPlan !== undefined) {
                provisioningPlan.provisioningTasks.push(pta);
            }
        });
    }

    private wrapProvisioningTasks(tasks:Array<any>) {
        this.provisioningTasks = new Array<ProvisioningTask>();
        tasks.forEach((task) => {
            this.provisioningTasks.push(new ProvisioningTask(task));
        })
    }

    private wrapAttributes(attributes:Array<any>) {
        this.attributes = new Array<Attribute>();
        attributes.forEach((a) => {
            let attributeTyped = new Attribute(a);
            const attributesFiltered = this.attributeLocalValues.filter(e=>e['enxCPQ__Attribute__r']['enxCPQ__TECH_External_Id__c'] === a['enxCPQ__TECH_External_Id__c'])
            if (attributesFiltered !== undefined && attributesFiltered.length > 0) {
                attributeTyped.attributeValues.push(...attributesFiltered);
            }
            this.attributes.push(attributeTyped);
        });
        this.attributes.sort((a, b) => (a.record.Name > b.record.Name) ? 1 : -1);
    }

    private wrapAttributeSets(attributeSets:Array<any>) {
        this.attributeSets = new Array<AttributeSet>();
        attributeSets.forEach((a) => {
            this.attributeSets.push(new AttributeSet(a));
        })
    }

    private wrapAttributeSetAttributes(attributeSetAttributes:Array<any>) {
        attributeSetAttributes.forEach((asa) => {
            const attributeSet = this.attributeSets.find(e => e.record['enxCPQ__TECH_External_Id__c'] === asa['enxCPQ__Attribute_Set__r']['enxCPQ__TECH_External_Id__c']);
            if (attributeSet !== undefined) {
                attributeSet.setAttributes.push(asa);
            }
        });
    }

    private wrapGlobalAttributeValues(globalAttributeValues:Array<any>) {
        globalAttributeValues.forEach((ava) => {
            let attribute;
            let isFileSystemBroken;
            try {
                attribute = this.attributes.find(e => e.record['enxCPQ__TECH_External_Id__c'] === ava['enxCPQ__Attribute__r']['enxCPQ__TECH_External_Id__c']);
                isFileSystemBroken = false;
            } catch (error) {
                attribute = this.attributes.find(e => e.record['enxCPQ__TECH_External_Id__c'] === ava['enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c']);
                isFileSystemBroken = true;
            }
            if (attribute !== undefined) {
                if (isFileSystemBroken) {
                    ava.enxCPQ__Attribute__r = {};
                    ava.enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c = ava['enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c'];
                    delete ava['enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c'];
                    attribute.attributeValues.push(ava);
                } else {
                    attribute.attributeValues.push(ava);
                }
                attribute.attributeValues.sort((a, b) => (a.Name > b.Name) ? 1 : -1);
            }
        });
    }

    private wrapChargeDefinitions(chargeDefinitions:Array<any>) {
        this.charges = new Array<Charge>();
        chargeDefinitions.forEach((c) => {
            this.charges.push(new Charge(c));
        })
    }

    private wrapChargeElements(elements:Array<any>) {
        elements.forEach((elem) => {
            let charge;
            let isFileSystemBroken;
            try {
                charge = this.charges.find(e => e.record['enxCPQ__TECH_External_Id__c'] === elem['enxCPQ__Charge_Parent__r']['enxCPQ__TECH_External_Id__c']);
                isFileSystemBroken = false;
            } catch (error) {
                charge = this.charges.find(e => e.record['enxCPQ__TECH_External_Id__c'] === elem['enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c']);
                isFileSystemBroken = true;
            }
            if (charge !== undefined) {
                if (isFileSystemBroken) {
                    elem.enxCPQ__Attribute__r = {};
                    elem.enxCPQ__Attribute__r.enxCPQ__TECH_External_Id__c = elem['enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c'];
                    delete elem['enxCPQ__Charge_Parent__r.enxCPQ__TECH_External_Id__c'];
                    charge.attributeValues.push(elem);
                } else {
                    charge.chargeElements.push(elem);
                }
            }
        });
    }

    private wrapChargeTiers(tiers:Array<any>) {
        tiers.forEach((tier) => {
            const charge = this.charges.find(e => e.record['enxCPQ__TECH_External_Id__c'] === tier['enxCPQ__Charge_Parent__r']['enxCPQ__TECH_External_Id__c']);
            if (charge !== undefined) {
                charge.chargeTiers.push(tier);
            }
        });
    }

    private wrapCategories(categories:Array<any>) {
        if (!this.categories) this.categories = new Array<Category>();
        categories.forEach((c) => {
            this.categories.push(new Category(c));
        })
    }

    private wrapPricebooks(paramPricebooks:Array<any>) {
        paramPricebooks.forEach((pbook) => {
            let pricebook = this.pricebooks.find(p => p.record['enxCPQ__TECH_External_Id__c'] === pbook['enxCPQ__TECH_External_Id__c']);
            if (pricebook === undefined) {
                pricebook = this.pricebooks.find(p => p.record['IsStandard'] === pbook['IsStandard'] && p.record['IsStandard'] === true);
            }
            if (pricebook !== undefined) {
                pricebook.record = pbook;
            } else {
                this.pricebooks.push(new Pricebook(pbook));
            }
        })
    }

    private wrapStandardPricebookEntries(pricebookEntries:Array<any>) {
        pricebookEntries.forEach((pbe) => {
            const pricebook = this.pricebooks.find(e => e.isStandard);
            if (pricebook !== undefined) {
                let productTechId = pbe['Product2']['enxCPQ__TECH_External_Id__c'];
                let currencyCode = pbe['CurrencyIsoCode'];
                if (pricebook.stdPricebookEntries.hasOwnProperty(productTechId)) {
                    const entriesArray = pricebook.stdPricebookEntries[productTechId];
                    const elementIndex = entriesArray.findIndex(elem => {return elem['Product2']['enxCPQ__TECH_External_Id__c'] === productTechId && elem['CurrencyIsoCode'] === currencyCode});
                    if (elementIndex !== -1) {
                        pricebook.stdPricebookEntries[productTechId].splice(elementIndex, 1);
                        pricebook.stdPricebookEntries[productTechId] = [...pricebook.stdPricebookEntries[productTechId], pbe];
                    } else {
                        pricebook.stdPricebookEntries[productTechId] = [...pricebook.stdPricebookEntries[productTechId], pbe];
                    }
                    pricebook.stdPricebookEntries[productTechId].sort((elem1, elem2) => { return elem1['CurrencyIsoCode'] > elem2['CurrencyIsoCode'] });
                } else {
                    pricebook.stdPricebookEntries[productTechId] = [pbe];
                }
            }
        });
    }

    private wrapPricebookEntries(pricebookEntries:Array<any>) {
        pricebookEntries.forEach((pbe) => {
            const pricebook = this.pricebooks.find(e => e.record['enxCPQ__TECH_External_Id__c'] === pbe['Pricebook2']['enxCPQ__TECH_External_Id__c']);
            if (pricebook !== undefined) {
                let productTechId = pbe['Product2']['enxCPQ__TECH_External_Id__c'];
                let currencyCode = pbe['CurrencyIsoCode'];
                if (pricebook.pricebookEntries.hasOwnProperty(productTechId)) {
                    const entriesArray = pricebook.pricebookEntries[productTechId];
                    const elementIndex = entriesArray.findIndex(elem => {return elem['Product2']['enxCPQ__TECH_External_Id__c'] === productTechId && elem['CurrencyIsoCode'] === currencyCode});
                    if (elementIndex !== -1) {
                        pricebook.pricebookEntries[productTechId].splice(elementIndex, 1);
                        pricebook.pricebookEntries[productTechId] = [...pricebook.pricebookEntries[productTechId], pbe];
                    } else {
                        pricebook.pricebookEntries[productTechId] = [...pricebook.pricebookEntries[productTechId], pbe];
                    }
                    pricebook.pricebookEntries[productTechId].sort((elem1, elem2) => { return elem1['CurrencyIsoCode'] > elem2['CurrencyIsoCode'] });
                } else {
                    pricebook.pricebookEntries[productTechId] = [pbe];
                }
            }
        });
    }

    private async loadPricebooks() {
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

  private async loadQueryFields(queryDir: string) {
    return new Promise<String>((resolve: Function, reject: Function) => {
      let content;
      fs.readFile('./' + queryDir + '/qryFields.json', function read(err, data) {
        if (err) {
          if (err.code == 'ENOENT') {
            resolve({});
          }
          reject(err);
        } else {
          content = data.toString('utf8');
          resolve(JSON.parse(content));
        }
      });
    });
  }

}
