import { ProductSelector } from './../selector/ProductSelector';
import { Product } from './Product';
import { Attribute } from './Attribute';
import { AttributeSet } from './AttributeSet';
import { ProvisioningPlan } from './ProvisioningPlan';
import { ProvisioningTask } from './ProvisioningTask';
import { Charge } from './Charge';
import { Category } from './Category';
import { Pricebook } from './Pricebook';
import { FileManager } from './../file/FileManager';
import { Connection } from "@salesforce/core";
import { Util } from './../Util';
import * as fs from 'fs';

export class ProductExport {

    private productIds:Array<String>;
    private attributeIds:Array<String>;
    private categoryIds:Array<String>;
    private attributeSetIds:Array<String>;
    private provisioningPlanIds:Array<String>;
    private provisioningTaskIds:Array<String>;
    private chargeIds:Array<String>;

    private products:Array<Product>;
    private attributes:Array<Attribute>;
    private attributeSets:Array<AttributeSet>;
    private provisioningPlans:Array<ProvisioningPlan>;
    private provisioningTasks:Array<ProvisioningTask>;
    private charges:Array<Charge>;
    private categories:Array<Category>;
    private pricebooks:Array<Pricebook>;

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
        
        const querySettings = await this.loadQueryConfiguration(this.targetDirectory);
        const productSelector = new ProductSelector(querySettings);
        
        const allProducts = await this.getAllProducts(productSelector);
        this.setProductExportScope(productNames, allProducts);

        this.fileManager.createDirectoriesForExport();
        
        // -- products export begin
        const products = await productSelector.getProducts(this.connection, this.productIds);
        this.wrapProducts(products);

        const productOptions = await productSelector.getProductOptions(this.connection, this.productIds);
        this.wrapProductOptions(productOptions);

        const charges = await productSelector.getCharges(this.connection, this.productIds);
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

        if (this.exportB2BObjects) {
            const productProvisioningPlans = await productSelector.getProductProvisioningPlans(this.connection, this.productIds);
            this.wrapProductProvisioningPlans(productProvisioningPlans);
        }
        // -- products export end


        // -- categories begin
        this.categoryIds = [];
        this.products.forEach(product => { if (product.getCategoryId() != null) this.categoryIds.push(product.getCategoryId()) });

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

        const chargeDefinitions = await productSelector.getChargeDefinitions(this.connection, this.chargeIds);
        this.wrapChargeDefinitions(chargeDefinitions);

        const chargeElements = await productSelector.getChargeElements(this.connection, this.chargeIds);
        this.wrapChargeElements(chargeElements);

        const chargeTiers = await productSelector.getChargeTiers(this.connection, this.chargeIds);
        this.wrapChargeTiers(chargeTiers);
        // -- charges end


        // -- pricebooks begin
        const pricebooks = await productSelector.getPricebooks(this.connection);
        this.wrapPricebooks(pricebooks);

        let pricebooksIds = [];
        this.pricebooks.forEach(pbook => { pricebooksIds = [... pricebooksIds, pbook.getPricebookId()] })

        let pricebookEntryProductIds = [];
        this.products.forEach(product => { pricebookEntryProductIds = [... pricebookEntryProductIds, ...product.getAllProductIds()] });
        this.charges.forEach(charge => { pricebookEntryProductIds = [... pricebookEntryProductIds, ...charge.getAllProductIds()] });

        const standardPricebookEntries = await productSelector.getStandardPricebookEntries(this.connection, pricebookEntryProductIds);
        this.wrapStandardPricebookEntries(standardPricebookEntries);

        const allPricebookEntries = await productSelector.getPricebookEntries(this.connection, pricebookEntryProductIds, pricebooksIds);
        this.wrapPricebookEntries(allPricebookEntries);
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


        // -- saving files begin
        await this.products.forEach((product) => {
            this.fileManager.writeFile('products', product.getFileName(), product);
        });

        await this.attributes.forEach((attribute) => {
            this.fileManager.writeFile('attributes', attribute.getFileName(), attribute);
        });

        await this.charges.forEach((charge) => {
            this.fileManager.writeFile('charges', charge.getFileName(), charge);
        });

        await this.categories.forEach((category) => {
            this.fileManager.writeFile('categories', category.getFileName(), category);
        });

        await this.attributeSets.forEach((attributeSet) => {
            this.fileManager.writeFile('attributeSets', attributeSet.getFileName(), attributeSet);
        });

        await this.pricebooks.forEach((pbook) => {
            this.fileManager.writeFile('priceBooks', pbook.getFileName(), pbook);
        });

        if (this.exportB2BObjects) {
            await this.provisioningPlans.forEach((plan) => {
                this.fileManager.writeFile('provisioningPlans', plan.getFileName(), plan);
            });

            await this.provisioningTasks.forEach((task) => {
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

    private wrapProducts(products:Array<any>) {
        this.products = new Array<Product>();
        products.forEach((p) => {
            this.products.push(new Product(p));
        })
    }

    private wrapProductOptions(productOptions:Array<any>) {
        productOptions.forEach((option) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === option['enxCPQ__Parent_Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.options.push(option);
            }
        });
    }

    private wrapProductCharges(productCharges:Array<any>) {
        productCharges.forEach((charge) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === charge['enxCPQ__Root_Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.charges.push(charge);
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
        productAttributeValues.forEach((ava) => {
            const product = this.products.find(e => e.record['enxCPQ__TECH_External_Id__c'] === ava['enxCPQ__Exclusive_for_Product__r']['enxCPQ__TECH_External_Id__c']);
            if (product !== undefined) {
                product.attributeValues.push(ava);
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
            this.attributes.push(new Attribute(a));
        })
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
            const attribute = this.attributes.find(e => e.record['enxCPQ__TECH_External_Id__c'] === ava['enxCPQ__Attribute__r']['enxCPQ__TECH_External_Id__c']);
            if (attribute !== undefined) {
                attribute.attributeValues.push(ava);
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
            const charge = this.charges.find(e => e.record['enxCPQ__TECH_External_Id__c'] === elem['enxCPQ__Charge_Parent__r']['enxCPQ__TECH_External_Id__c']);
            if (charge !== undefined) {
                charge.chargeElements.push(elem);
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

    private wrapPricebooks(pricebooks:Array<any>) {
        this.pricebooks = new Array<Pricebook>();
        pricebooks.forEach((pbook) => {
            this.pricebooks.push(new Pricebook(pbook));
        })
    }

    private wrapStandardPricebookEntries(pricebookEntries:Array<any>) {
        pricebookEntries.forEach((pbe) => {
            const pricebook = this.pricebooks.find(e => e.isStandard);
            if (pricebook !== undefined) {
                const productTechId = pbe['Product2']['enxCPQ__TECH_External_Id__c'];
                if (pricebook.stdPricebookEntries.hasOwnProperty(productTechId)) {
                    pricebook.stdPricebookEntries[productTechId].push(pbe);
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
                const productTechId = pbe['Product2']['enxCPQ__TECH_External_Id__c'];
                if (pricebook.pricebookEntries.hasOwnProperty(productTechId)) {
                    pricebook.pricebookEntries[productTechId].push(pbe);
                } else {
                    pricebook.pricebookEntries[productTechId] = [pbe];
                }
            }
        });
    }

    private async loadQueryConfiguration(queryDir: string) {
        return new Promise<String>((resolve: Function, reject: Function) => {
            let content;
            fs.readFile('./' + queryDir + '/queryConfiguration.json', function read(err, data) {
                if (err) {
                    reject(err);
                }
                content = data.toString('utf8');
                resolve(JSON.parse(content));
            });
        });
    }

}