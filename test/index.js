const newman = require('newman')
const assert = require('chai').assert
const exporter = require('../export/json')
const importerFromJson = require('../import/json')
const fs = require('fs')

describe("CMDB Integration test suite", function() {
    this.timeout(15000)
    describe('run postman test', function() {
        it('postman tests from collection file', function(done) {
            newman.run({
                collection: JSON.parse(fs.readFileSync('./test/cmdb.postman_collection.json', 'utf8')),
                environment: JSON.parse(fs.readFileSync(process.env['ENVIRONMENT_FILE'], 'utf8')),
                reporters: 'cli'
            }, done);
        })
    });

    describe('json export and import', function() {
        it('export all categories', function(done) {
            console.time("exportAll")
            exporter().then((result)=>{
                console.timeEnd("exportAll");
                console.log(JSON.stringify(result))
                process.env['IMPORT_FOLDER'] = result.directory
                done()
            }).catch(done)
        });

        it('import all categories', function(done) {
            console.time("importAll")
            new importerFromJson().importer().then((result)=>{
                console.timeEnd("importAll");
                console.log(JSON.stringify(result))
                assert.equal(result['ConfigurationItem']['errorItems'].length,0)
                done()
            }).catch(done)
        });
    });
})
