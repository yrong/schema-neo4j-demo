let rp = require('request-promise');

let assert = require('chai').assert;

let syncPromise = require('../sync');

let base_uri = 'http://localhost:3000/api',userid=1,result,options,cabinet_id,location_id,
    service_1_id,service_2_id,service_3_id,service_4_id,service_group_id,service_id,camera_id

let it_service = require('./testdata/it_service_with_rel.json');

let physical_server = require('./testdata/physical_server.json');

let router = require('./testdata/router.json');

let storage = require('./testdata/storage.json');

let virtual_server = require('./testdata/virtual_server.json');

let camera = require('./testdata/camera.json');

let cmdb_count = 5

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

    it("add Cabinet instance", function(done) {
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
            assert.isNotNull(result.uuid);
        });
    });

    it("add Location instance", function(done) {
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
            assert.isNotNull(result.uuid);
        });
    });

    it("add ServiceGroup instance", function(done) {
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
            assert.isNotNull(result.uuid);
        });
    });

    it("add Service instance 1", function(done) {
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
            assert.isNotNull(result.uuid);
        });
    });

    it("add Service instance 2", function(done) {
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

    it("add Service instance 3", function(done) {
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

    it("add Service instance 4", function(done) {
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

    it("add center Service instance which has all kinds of relationship to others", function(done) {
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
            assert.isNotNull(result.uuid);
        });
    });

    it("add Camera instance with relationship to ITservice instance and Cabinet instance and User instance", function(done) {
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
            camera_id  = result.uuid;
            done();
            assert.isNotNull(result.uuid);
        });
    });

    it("add Router instance with relationship to ITservice instance and Cabinet instance and User instance", function(done) {
        router.data.fields.it_service = service_id;
        router.data.fields.asset_location.cabinet = cabinet_id;

        options = {
            method: 'POST',
            uri: base_uri+'/cfgItems',
            body: router,
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            done();
        });
    });

    it("add PhysicalServer instance with relationship to ITservice instance and Location instance", function(done) {
        physical_server.data.fields.it_service = service_id;
        physical_server.data.fields.asset_location.location = location_id;

        options = {
            method: 'POST',
            uri: base_uri+'/cfgItems',
            body: physical_server,
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            done();
        });
    });

    it("add Storage instance with relationship to ITservice instance and Location instance", function(done) {
        storage.data.fields.it_service = service_id;
        storage.data.fields.asset_location.location = location_id;

        options = {
            method: 'POST',
            uri: base_uri+'/cfgItems',
            body: storage,
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            done();
        });
    });

    it("add VirtualServer instance with relationship to ITservice instance", function(done) {
        virtual_server.data.fields.it_service = service_id;

        options = {
            method: 'POST',
            uri: base_uri+'/cfgItems',
            body: virtual_server,
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            done();
        });
    });

    it("query all cfgItems", function(done) {
        options = {
            method: 'GET',
            uri: base_uri+'/cfgItems',
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            done();
            assert.equal(result.data.count,cmdb_count);
        });
    });

    it("query pagination cfgItems", function(done) {
        options = {
            method: 'GET',
            uri: base_uri+'/cfgItems?page=1&per_page=2',
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            done();
            assert.equal(result.data.results.length,2);
        });
    });

    it("delete cfgItem by uuid", function(done) {
        options = {
            method: 'DELETE',
            uri: base_uri+'/cfgItems/'+ camera_id,
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            done();
            assert.equal(result.uuid,camera_id);
        });
    });

    it("query all cfgItems with result as count minus 1", function(done) {
        options = {
            method: 'GET',
            uri: base_uri+'/cfgItems',
            json: true
        };
        rp(options).then(function(result){
            console.log(result);
            done();
            assert.equal(result.data.count,cmdb_count--);
        });
    });




});