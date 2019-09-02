
var jsforce = require('jsforce');
//var config = require('../config/credentials');
var _ = require('lodash');

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


const fixIds = (arrs) => {
   
    var arr = Object.keys(arrs).map(function(key) {
        return [String(key), arrs[key]];
    });
    console.log(typeof arr);
    console.log( arr);
    for (let i = 0; i < arr.length; i++) {
        console.log(arr[i]);
        if (arr[i]['Pricebook2Id'] !== undefined) {
            console.log('początek pricebook')
            console.log( arr[i]['Pricebook2Id'])
            console.log( idMapping[arr[i]['Pricebook2Id']])
            console.log('koniec pricebook')
            arr[i]['Pricebook2Id'] = idMapping[arr[i]['Pricebook2Id']];   
        }
        if (arr[i]['Product2Id'] !== undefined) {
            console.log('początek product')
            console.log( arr[i]['Product2Id'])
            console.log(idMapping[arr[i]['Product2Id']])
            console.log('koniec product')
            arr[i]['Product2Id'] = idMapping[arr[i]['Product2Id']];   
        }
    }
}

var idMapping = {}

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
   
    for (let i = 0 ; i < sourceProducts.length; i++) {
        for (let j = 0; j < targetProducts.length; j++) {
            if (sourceProducts[i].enxCPQ__TECH_External_Id__c === targetProducts[j].enxCPQ__TECH_External_Id__c) {
                idMapping[sourceProducts[i].Id] = targetProducts[j].Id;
                break;
            }
        }
    }
}

const disableTriggers = (conn) => {
    var data = { Name: "G_CPQ_DISABLE_TRIGGERS_99",
                 enxCPQ__Setting_Name__c: "CPQ_DISABLE_TRIGGERS",
                 enxCPQ__Context__c: "Global",
                 enxCPQ__Col1__c: conn.getUsername() };

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

module.exports = {
    sanitize: sanitize,
    enableTriggers: enableTriggers,
    disableTriggers: disableTriggers,
    sanitizeDeep: sanitizeDeep,
    mapPricebooks: mapPricebooks,
    mapProducts: mapProducts,
    deletePricebookEntries: deletePricebookEntries,
    upsertPricebookEntries: upsertPricebookEntries,
    upsertBulkProducts: upsertBulkProducts,
    deleteBulkPricebookEntries: deleteBulkPricebookEntries,
    upsertBulkPricebookEntries: upsertBulkPricebookEntries,
}
