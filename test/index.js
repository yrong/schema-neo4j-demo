var newman = require('newman');
require("babel-core/register");
require("babel-polyfill");
var assert = require('chai').assert;
var importer = require("../import/ConfigurationItem.js");

describe("CMDB Integration test suite", function() {
    this.timeout(15000)
    beforeEach(function(done) {
        newman.run({
            collection: require('./cmdb.postman_collection.json'),
            environment: require('./cmdb.postman_environment.json'),
            reporters: 'cli'
        }, function (err) {
            if (err) { return done(err)}
            console.log('postman collection run complete!')
            done()
        });
    });

    describe('import cmdb excel file test', function() {
        it('1 line error with it_service name not exist', function(done) {
            console.time("importConfigurationItemConsuming")
            importer().then((result)=>{
                console.timeEnd("importConfigurationItemConsuming");
                console.log(JSON.stringify(result))
                assert.equal(result.success_num, 1);
                assert.equal(result.exception_num, 1);
                done()
            }).catch(done)
        });
    });
})
