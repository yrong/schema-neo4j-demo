let rp = require('request-promise');

let syncPromise = require('../sync');

let base_uri = 'http://localhost:3000/api',userid=1,result,options,cabinet_id,location_id,
    service_1_id,service_2_id,service_3_id,service_4_id,service_group_id,service_id

let it_service = require('./testdata/it_service_with_rel.json');

let physical_server = require('./testdata/physical_server.json');

let router = require('./testdata/router.json');

let storage = require('./testdata/storage.json');

let virtual_server = require('./testdata/virtual_server.json');

let camera = require('./testdata/camera.json');

describe("CMDB Integration test suite", function() {

    it("clear all items in db", function(done) {
        options = {
            method: 'DELETE',
            uri: base_uri+'/items'
        };
        rp(options).then(function(result){
            console.log(result);
            done();
        })
    });

    it("sync user from mysql", function(done) {
        syncPromise().then(function(){
            done();
        })
    });

    it("add Cabinet", function(done) {
        options = {
            method: 'POST',
            uri: base_uri+'/cabinets',
            body: require('./testdata/cabinet.json'),
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            cabinet_id = result.uuid;
            done();
        });
    });

    it("add Location", function(done) {
        options = {
            method: 'POST',
            uri: base_uri+'/locations',
            body: require('./testdata/location.json'),
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            location_id = result.uuid;
            done();
        });
    });

    it("add ServiceGroup", function(done) {
        options = {
            method: 'POST',
            uri: base_uri+'/it_services/group',
            body: require('./testdata/it_service_group.json'),
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            service_group_id = result.uuid;
            done();
        });
    });

    it("add Service-1", function(done) {
        options = {
            method: 'POST',
            uri: base_uri+'/it_services/service',
            body: require('./testdata/it_service.json'),
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            service_1_id = result.uuid;
            done();
        });
    });

    it("add Service-2", function(done) {
        options = {
            method: 'POST',
            uri: base_uri+'/it_services/service',
            body: require('./testdata/it_service.json'),
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            service_2_id = result.uuid;
            done();
        });
    });

    it("add Service-3", function(done) {
        options = {
            method: 'POST',
            uri: base_uri+'/it_services/service',
            body: require('./testdata/it_service.json'),
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            service_3_id = result.uuid;
            done();
        });
    });

    it("add Service-4", function(done) {
        options = {
            method: 'POST',
            uri: base_uri+'/it_services/service',
            body: require('./testdata/it_service.json'),
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            service_4_id = result.uuid;
            done();
        });
    });

    it("add center it_service which has relationship to others", function(done) {
        it_service.data.fields.group = service_group_id;
        it_service.data.fields.parent = service_1_id;
        it_service.data.fields.children = [service_2_id];
        it_service.data.fields.dependencies = [service_3_id];
        it_service.data.fields.dependendents = [service_4_id];
        options = {
            method: 'POST',
            uri: base_uri+'/it_services/service',
            body: it_service,
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            service_id = result.uuid;
            done();
        });
    });

    it("add camera", function(done) {
        camera.data.fields.it_service = service_id;
        camera.data.fields.asset_location.cabinet = cabinet_id;

        options = {
            method: 'POST',
            uri: base_uri+'/cfgItems',
            body: camera,
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            done();
        });
    });


});