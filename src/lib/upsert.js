
var jsforce = require('jsforce');
//var config = require('../config/credentials');
var _ = require('lodash');

const upsertAttributeSets = (conn, data) => {
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__AttributeSet__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating attribute sets: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
            console.log("--- upserted attribute sets: " + rets.length + ", errors: " + errorsCount);
            resolve('OK');
        });
    });
};

const upsertAttributeSetAttributes = (conn, data) => {
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__AttributeSetAttribute__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating attribute set attributes: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
            console.log("--- upserted attribute set attributes: " + rets.length + ", errors: " + errorsCount);
            resolve('OK');
        });
    });
};

const upsertCategories = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__Category__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating categories: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
            console.log("--- upserted categories: " + rets.length + ", errors: " + errorsCount);
            resolve('OK');
        });
    });
};

const upsertAttributes = (conn, data) => {
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__Attribute__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating attributes: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
            console.log("--- upserted attributes: " + rets.length + ", errors: " + errorsCount);
            resolve();
        });
    });
};

const upsertProducts = async (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("Product2").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating product: ' + err); 
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
            console.log("--- upserted products: " + rets.length + ", errors: " + errorsCount);
            resolve();
        });
    });
};

const upsertAttributeValues = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__AttributeValue__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating attribute values: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted attribute values: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const deleteProductAttributes = (conn, data) => { 
    data = extractIds(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__ProductAttribute__c").del(data, { allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error deleting product attributes: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- deleted product attributes: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertProductAttributes = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__ProductAttribute__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating product attributes: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted product attributes: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertPricebooks = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("Pricebook2").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating pricebooks: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted pricebooks: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const deletePricebookEntries = (conn, data) => { 
    data = extractIds(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("PricebookEntry").del(data, { allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error deleting pricebook entries: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- deleted pricebook entries: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertPricebookEntries = (conn, data) => { 
    sanitize(data);
    fixIds(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("PricebookEntry").insert(data, { allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating pricebook entries: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted pricebook entries: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertProductRelationships = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__ProductRelationship__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating product relationships: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted product relationships: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertAttributeDefaultValues = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__AttributeDefaultValue__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                console.log(err);
                reject('error creating attribute default values: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted attribute default values: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertAttributeValueDependencies = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__AttributeValueDependency__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating attribute value dependencies: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted attribute value dependencies: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertAttributeRules = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__AttributeRule__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating attribute rules: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted attribute rules: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertProvisioningPlans = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxB2B__ProvisioningPlan__c").upsert(data, "enxB2B__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating provisioning plans: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted provisioning plans: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertProvisioningTasks = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxB2B__ProvisioningTask__c").upsert(data, "enxB2B__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating provisioning tasks: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted provisioning tasks: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const deleteProvisioningPlanAssignments = (conn, data) => { 
    data = extractIds(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxB2B__ProvisioningPlanAssignment__c").del(data, { allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error deleting provisioning plan assignments: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- deleted provisioning plan assignments: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const deleteProvisioningTaskAssignments = (conn, data) => { 
    data = extractIds(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxB2B__ProvisioningTaskAssignment__c").del(data, { allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error deleting provisioning task assignments: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- deleted provisioning task assignments: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertProvisioningPlanAssignments = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxB2B__ProvisioningPlanAssignment__c").insert(data, { allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating provisioning plan assignments: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted provisioning plan assignments: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertProvisioningTaskAssignments = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxB2B__ProvisioningTaskAssignment__c").insert(data, { allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating provisioning task assignments: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted provisioning task assignments: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertPriceRules = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__PriceRule__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating price rules: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted price rules: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertPriceRuleConditions = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__PriceRuleCondition__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating price rule conditions: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted price rule conditions: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertPriceRuleActions = (conn, data) => { 
    sanitize(data);
    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__PriceRuleAction__c").upsert(data, "enxCPQ__TECH_External_Id__c", { allOrNone: true, allowRecursive: true }, function(err, rets) {
            if (err) {
                reject('error creating price rule actions: ' + err);
                return;
            }
            let errorsCount = 0;
            for (let i = 0; i < rets.length; i++) {
                if (!rets[i].success) {
                    console.log('----- !!! - success: ' + rets[i].success + ' errors: ' + JSON.stringify(rets[i].errors));
                    errorsCount++;
                }
            }
        console.log("--- upserted price rule actions: " + rets.length + ", errors: " + errorsCount);
        resolve();
        });
    });
};

const upsertBulkProducts = (conn, data) => {
    sanitize(data);
    return new Promise((resolve, reject) => {
        conn.bulk.load("Product2", "upsert", {"extIdField": "enxCPQ__TECH_External_Id__c"}, data, function(err, rets) {
            if (err) { reject(err); }
            var successCount = 0;
            var errorsCount = 0;
            for (var i=0; i < rets.length; i++) {
                if (rets[i].success) {
                    successCount++;
                } else {
                    errorsCount++;
                }
                process.stdout.write("--- upsert success: " + successCount + " errors: " + errorsCount + "\r");
            }
            resolve();
        });
    });
}

const deleteBulkPricebookEntries = (conn, data) => {
    return new Promise((resolve, reject) => {
        conn.bulk.load("PricebookEntry", "delete", data, function(err, rets) {
            if (err) { reject(err); }
            var successCount = 0;
            var errorsCount = 0;
            for (var i=0; i < rets.length; i++) {
                if (rets[i].success) {
                    successCount++;
                } else {
                    errorsCount++;
                }
                process.stdout.write("--- delete success: " + successCount + " errors: " + errorsCount + "\r");
            }
            resolve();
        });
    });
}

const upsertBulkPricebookEntries = (conn, data) => {
    sanitize(data);
    fixIds(data);
    return new Promise((resolve, reject) => {
        conn.bulk.load("PricebookEntry", "insert", data, function(err, rets) {
            if (err) { reject(err); }
            var successCount = 0;
            var errorsCount = 0;
            for (var i=0; i < rets.length; i++) {
                if (rets[i].success) {
                    successCount++;
                } else {
                    errorsCount++;
                }
                process.stdout.write("--- insert success: " + successCount + " errors: " + errorsCount + "\r");
            }
            resolve();
        });
    });
}

const disableTriggers = (conn) => {
    var data = { Name: "G_CPQ_DISABLE_TRIGGERS_99",
                 enxCPQ__Setting_Name__c: "CPQ_DISABLE_TRIGGERS",
                 enxCPQ__Context__c: "Global",
                 enxCPQ__Col1__c: config.targetOrg.username };

    return new Promise ((resolve, reject) => {
        conn.sobject("enxCPQ__CPQ_Settings__c").insert(data, function(err, rets) {
            if (err) {
                reject('error disabling triggers: ' + err);
                return;
            }
        console.log("--- trigers disabled. setting id: " + rets.id);
        disableTriggerSettingId = rets.id;
        resolve();
        });
    });      
}

const enableTriggers = (conn) => {
    return new Promise ((resolve, reject) => {
        conn.query("SELECT Id FROM enxCPQ__CPQ_Settings__c WHERE Name = 'G_CPQ_DISABLE_TRIGGERS_99'", function(err, res) {
            if (res.records.length == 0) resolve();
            conn.sobject("enxCPQ__CPQ_Settings__c").del(res.records[0].Id, function(err, rets) {
                if (err) {
                    reject('error enabling triggers: ' + err);
                    return;
                }
                console.log("--- trigers enabled");
                resolve();
            }); 
        });
    });      
}

var disableTriggerSettingId;

const extractIds = (arr) => {
    var targetArr = []
    for (let i = 0; i < arr.length; i++) {
      targetArr.push(arr[i].Id);
    }
    return targetArr;
  }

const sanitizeDeep = (arr) => {
    var arrResult =  JSON.parse(JSON.stringify(arr));
    for (let i = 0; i < arrResult.length; i++) {
        for (let prop in arrResult[i]) {
            if (prop === 'attributes') delete arrResult[i][prop];
            if (prop === 'RecordTypeId') delete arrResult[i][prop];
            if (prop.indexOf('__r') !== -1) delete arrResult[i][prop];
        }
    }
    return arrResult;
}

const sanitize = (arr) => {
    if (!(arr instanceof Array)) {
        for (let prop in arr) {
            if (prop === 'attributes') delete arr[prop];
            if (prop.indexOf('__r') !== -1 && arr[prop] == null) delete arr[prop];
            if (typeof(arr[prop]) === 'object') {
                for (let innerProp in arr[prop]) {
                    if (innerProp === 'attributes') delete arr[prop][innerProp];
                }
            }
        }
        return;
    }

    fixRecordTypes(arr);
    for (let i = 0; i < arr.length; i++) {
        for (let prop in arr[i]) {
            if (prop === 'attributes') delete arr[i][prop];
            if (prop.indexOf('__r') !== -1 && arr[i][prop] == null) delete arr[i][prop];
            if (typeof(arr[i][prop]) === 'object') {
                for (let innerProp in arr[i][prop]) {
                    if (innerProp === 'attributes') delete arr[i][prop][innerProp];
                }
            }
        }
    }

    for (let prop in arr) {
        if (prop === 'attributes') delete arr[prop];
        if (prop.indexOf('__r') !== -1 && arr[prop] == null) delete arr[prop];
        if (typeof(arr[prop]) === 'object') {
            for (let innerProp in arr[prop]) {
                if (innerProp === 'attributes') delete arr[prop][innerProp];
            }
        }
    }
}

const fixRecordTypes = (arr) => {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i]['RecordTypeId'] !== undefined) {
            // console.log('Replacing ' + arr[i]['RecordTypeId'] + ' with ' + recordTypeMapping[arr[i]['RecordTypeId']]);
            arr[i]['RecordTypeId'] = recordTypeMapping[arr[i]['RecordTypeId']];   
        }
    }
}

const fixIds = (arr) => {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i]['Pricebook2Id'] !== undefined) {
            arr[i]['Pricebook2Id'] = idMapping[arr[i]['Pricebook2Id']];   
        }
        if (arr[i]['Product2Id'] !== undefined) {
            arr[i]['Product2Id'] = idMapping[arr[i]['Product2Id']];   
        }
    }
}

var recordTypeMapping = {};
var idMapping = {}

const mapRecordTypes = (sourceRecordTypes, targetRecordTypes) => {
    console.log("--- mapping record types");
    for (let i = 0 ; i < sourceRecordTypes.length; i++) {
        for (let j = 0; j < targetRecordTypes.length; j++) {
            if (sourceRecordTypes[i].DeveloperName === targetRecordTypes[j].DeveloperName &&
                sourceRecordTypes[i].SObjectType === targetRecordTypes[j].SObjectType) {
                    recordTypeMapping[sourceRecordTypes[i].Id] = targetRecordTypes[j].Id;
                    break;
            }
        }
    }
}

const mapPricebooks = (sourcePricebooks, targetPricebooks) => {
    console.log("--- mapping pricebooks");
    for (let i = 0 ; i < sourcePricebooks.length; i++) {
        for (let j = 0; j < targetPricebooks.length; j++) {
            if (sourcePricebooks[i].enxCPQ__TECH_External_Id__c != null && sourcePricebooks[i].enxCPQ__TECH_External_Id__c === targetPricebooks[j].enxCPQ__TECH_External_Id__c) {
                idMapping[sourcePricebooks[i].Id] = targetPricebooks[j].Id;
                break;
            }
            if (sourcePricebooks[i].IsStandard && targetPricebooks[j].IsStandard) {
                idMapping[sourcePricebooks[i].Id] = targetPricebooks[j].Id;
                break;
            }
        }
    }
}

const mapProducts = (sourceProducts, targetProducts) => {
    console.log("--- mapping products");
    for (let i = 0 ; i < sourceProducts.length; i++) {
        for (let j = 0; j < targetProducts.length; j++) {
            if (sourceProducts[i].enxCPQ__TECH_External_Id__c === targetProducts[j].enxCPQ__TECH_External_Id__c) {
                idMapping[sourceProducts[i].Id] = targetProducts[j].Id;
                break;
            }
        }
    }
}

module.exports = {
    sanitize: sanitize,
    sanitizeDeep: sanitizeDeep,
    mapRecordTypes: mapRecordTypes,
    mapPricebooks: mapPricebooks,
    mapProducts: mapProducts,
    upsertAttributeSets: upsertAttributeSets,
    upsertAttributeSetAttributes: upsertAttributeSetAttributes,
    upsertCategories: upsertCategories,
    upsertAttributes: upsertAttributes,
    upsertProducts: upsertProducts,
    upsertAttributeValues: upsertAttributeValues,
    deleteProductAttributes: deleteProductAttributes,
    upsertProductAttributes: upsertProductAttributes,
    upsertPricebooks: upsertPricebooks,
    deletePricebookEntries: deletePricebookEntries,
    upsertPricebookEntries: upsertPricebookEntries,
    upsertProductRelationships: upsertProductRelationships,
    upsertAttributeDefaultValues: upsertAttributeDefaultValues,
    upsertAttributeValueDependencies: upsertAttributeValueDependencies,
    upsertAttributeRules: upsertAttributeRules,
    deleteProvisioningPlanAssignments: deleteProvisioningPlanAssignments,
    deleteProvisioningTaskAssignments: deleteProvisioningTaskAssignments,
    upsertProvisioningPlans: upsertProvisioningPlans,
    upsertProvisioningTasks: upsertProvisioningTasks,
    upsertProvisioningPlanAssignments: upsertProvisioningPlanAssignments,
    upsertProvisioningTaskAssignments: upsertProvisioningTaskAssignments,
    upsertPriceRules: upsertPriceRules,
    upsertPriceRuleConditions: upsertPriceRuleConditions,
    upsertPriceRuleActions: upsertPriceRuleActions,
    upsertBulkProducts: upsertBulkProducts,
    deleteBulkPricebookEntries: deleteBulkPricebookEntries,
    upsertBulkPricebookEntries: upsertBulkPricebookEntries,
    enableTriggers: enableTriggers,
    disableTriggers, disableTriggers
}
