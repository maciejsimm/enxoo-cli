var jsforce = require('jsforce');
var config = require('../config/credentials');

module.exports = {

  loginSource: () => { 
    return new Promise((resolve, reject) => {
      console.log("--- Logging into source org");
      let conn = new jsforce.Connection({loginUrl: config.sourceOrg.loginUrl, maxRequest: 1000});
      conn.login(config.sourceOrg.username, config.sourceOrg.password + config.sourceOrg.token, function(err, res) {
        if (err) { reject(err); }
        console.log("--- Login successful");
        resolve(conn);
      });
    });
  },

  loginTarget: () => { 
    return new Promise((resolve, reject) => {
      console.log("--- Logging into target org");
      let conn = new jsforce.Connection({loginUrl: config.targetOrg.loginUrl, maxRequest: 5000});
      conn.login(config.targetOrg.username, config.targetOrg.password + config.targetOrg.token, function(err, res) {
        if (err) { reject(err); }
        console.log("--- Login successful");
        resolve(conn);
        });
    });
  }

}