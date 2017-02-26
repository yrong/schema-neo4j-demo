require("babel-core/register")
require("babel-polyfill")

const newman = require('newman')
const assert = require('chai').assert
const importerFromExcel = require('../import/excel')
const exporter = require('../export/json')
const importerFromJson = require('../import/json')

const Cmdb_Categories = [
    "Cabinet",
    "Position",
    "User",
    "ITServiceGroup",
    "ITService",
    "ConfigurationItem",
    "ProcessFlow"
]

describe("CMDB Integration test suite", function() {
    this.timeout(15000)
    describe('run postman test', function() {
        it('postman tests from collection file', function(done) {
            newman.run({
                collection: require('./cmdb.postman_collection.json'),
                environment: require('./cmdb.postman_environment.json'),
                reporters: 'cli'
            }, done);
        })
    });

    describe('import cmdb from excel file', function() {
        it('1 line error with it_service name not exist', function(done) {
            console.time("importerFromExcel")
            importerFromExcel().then((result)=>{
                console.timeEnd("importerFromExcel");
                console.log(JSON.stringify(result))
                assert.equal(result.PhysicalServer.success_num, 1);
                assert.equal(result.PhysicalServer.exception_num, 1);
                assert.equal(result.VirtualServer.success_num, 1);
                assert.equal(result.VirtualServer.exception_num, 1);
                done()
            }).catch(done)
        });
    });

    describe('json export and import', function() {
        it('export all categories', function(done) {
            console.time("exportAll")
            exporter().then((result)=>{
                console.timeEnd("exportAll");
                console.log(JSON.stringify(result))
                assert.equal(result.categories.length,Cmdb_Categories.length)
                process.env['IMPORT_FOLDER'] = result.directory
                done()
            }).catch(done)
        });

        it('import all categories', function(done) {
            console.time("importAll")
            importerFromJson().then((result)=>{
                console.timeEnd("importAll");
                console.log(JSON.stringify(result))
                assert.equal(result.length,Cmdb_Categories.length)
                done()
            }).catch(done)
        });
    });
})
