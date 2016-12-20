let rp = require('request-promise');

let assert = require('chai').assert;

let syncPromise = require('../sync');

let base_uri = 'http://localhost:3000/api',NOT_EXIST_ID = 'abcd',result,options,cabinet_id,location_id,
    service_1_id,service_2_id,service_3_id,service_4_id,group_1_id,group_2_id,group_3_id,service_id,camera_id,user_id,user_alias

let it_service_with_rel = require('./testdata/it_service_with_rel.json');

let it_service = require('./testdata/it_service.json')

let physical_server = require('./testdata/physical_server.json');

let router = require('./testdata/router.json');

let storage = require('./testdata/storage.json');

let virtual_server = require('./testdata/virtual_server.json');

let camera = require('./testdata/camera.json');

let cmdbs = [physical_server,router,storage,virtual_server,camera];

let process_flow = require('./testdata/process_flow.json')

let process_flow_desc = "Enter KING HENRY, LORD JOHN OF LANCASTER, the EARL of WESTMORELAND, SIR WALTER BLUNT, and others",match_word = 'henry',unmatch_word = 'hary';


describe("CMDB Integration test suite", function() {


    describe("init setup for adding all cmdb related items", function() {

        it("clear all items in db", function (done) {
            options = {
                method: 'DELETE',
                uri: base_uri + '/items'
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                done();
            })
        });

        it("sync user from mysql", function (done) {
            syncPromise().then(function (result) {
                user_id = result[0].userid;
                user_alias = result[0].alias;
                done();
            })
        });

        it("add Cabinet instance", function (done) {
            options = {
                method: 'POST',
                uri: base_uri + '/cabinets',
                body: require('./testdata/cabinet.json'),
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                cabinet_id = result.uuid;
                assert.isNotNull(result.uuid);
                done();
            });
        });

        it("add Location instance", function (done) {
            options = {
                method: 'POST',
                uri: base_uri + '/locations',
                body: require('./testdata/location.json'),
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                location_id = result.uuid;
                assert.isNotNull(result.uuid);
                done();
            });
        });

        it("add ServiceGroup instance 1", function (done) {
            options = {
                method: 'POST',
                uri: base_uri + '/it_services/group',
                body: require('./testdata/it_service_group.json'),
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                group_1_id = result.uuid;
                assert.isNotNull(result.uuid);
                done();
            });
        });

        it("add ServiceGroup instance 2", function (done) {
            options = {
                method: 'POST',
                uri: base_uri + '/it_services/group',
                body: require('./testdata/it_service_group.json'),
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                group_2_id = result.uuid;
                it_service.data.fields.group = group_2_id;
                assert.isNotNull(result.uuid);
                done();
            });
        });

        it("add ServiceGroup instance 3", function (done) {
            options = {
                method: 'POST',
                uri: base_uri + '/it_services/group',
                body: require('./testdata/it_service_group.json'),
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                group_3_id = result.uuid;
                assert.isNotNull(result.uuid);
                done();
            });
        });

        it("add Service instance 1", function (done) {
            options = {
                method: 'POST',
                uri: base_uri + '/it_services/service',
                body: it_service,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                service_1_id = result.uuid;
                assert.isNotNull(result.uuid);
                done();
            });
        });

        it("add Service instance 2", function (done) {
            options = {
                method: 'POST',
                uri: base_uri + '/it_services/service',
                body: it_service,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                service_2_id = result.uuid;
                done();
            });
        });

        it("add Service instance 3", function (done) {
            options = {
                method: 'POST',
                uri: base_uri + '/it_services/service',
                body: it_service,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                service_3_id = result.uuid;
                done();
            });
        });

        it("add Service instance 4", function (done) {
            options = {
                method: 'POST',
                uri: base_uri + '/it_services/service',
                body: it_service,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                service_4_id = result.uuid;
                done();
            });
        });

        it("add center Service instance which has all kinds of relationship to others", function (done) {
            it_service_with_rel.data.fields.group = group_1_id;
            it_service_with_rel.data.fields.parent = service_1_id;
            it_service_with_rel.data.fields.children = [service_2_id];
            it_service_with_rel.data.fields.dependencies = [service_3_id];
            it_service_with_rel.data.fields.dependendents = [service_4_id];
            options = {
                method: 'POST',
                uri: base_uri + '/it_services/service',
                body: it_service_with_rel,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                service_id = result.uuid;
                assert.isNotNull(result.uuid);
                done();
            });
        });

        it("add Camera instance with relationship to ITservice instance and Cabinet instance and User instance", function (done) {
            camera.data.fields.it_service = service_id;
            camera.data.fields.asset_location.cabinet = cabinet_id;
            camera.data.fields.userid = user_id;

            options = {
                method: 'POST',
                uri: base_uri + '/cfgItems',
                body: camera,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                camera_id = result.uuid;
                assert.isNotNull(result.uuid);
                done();
            });
        });

        it("add Router instance with relationship to ITservice instance and Cabinet instance and User instance", function (done) {
            router.data.fields.it_service = service_id;
            router.data.fields.asset_location.cabinet = cabinet_id;
            router.data.fields.userid = user_id;

            options = {
                method: 'POST',
                uri: base_uri + '/cfgItems',
                body: router,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                done();
            });
        });

        it("add PhysicalServer instance with relationship to ITservice instance and Location instance", function (done) {
            physical_server.data.fields.it_service = service_id;
            physical_server.data.fields.asset_location.location = location_id;

            options = {
                method: 'POST',
                uri: base_uri + '/cfgItems',
                body: physical_server,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                done();
            });
        });

        it("add Storage instance with relationship to ITservice instance and Location instance", function (done) {
            storage.data.fields.it_service = service_id;
            storage.data.fields.asset_location.location = location_id;

            options = {
                method: 'POST',
                uri: base_uri + '/cfgItems',
                body: storage,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                done();
            });
        });

        it("add VirtualServer instance with relationship to ITservice instance", function (done) {
            virtual_server.data.fields.it_service = service_id;

            options = {
                method: 'POST',
                uri: base_uri + '/cfgItems',
                body: virtual_server,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                done();
            });
        });

        it("add ProcessFlow instance with relationship to ITservice instance", function (done) {
            process_flow.data.fields.it_service = service_id;
            process_flow.data.fields.desc = process_flow_desc;

            options = {
                method: 'POST',
                uri: base_uri + '/processFlows',
                body: process_flow,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                setTimeout(done, 2000);//wait for es to refresh
            });
        });

    });

    describe("query test cases", function() {

        it("query all cfgItems", function (done) {
            options = {
                method: 'GET',
                uri: base_uri + '/cfgItems',
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.data.count, cmdbs.length);
                done();
            });
        });

        it("query pagination cfgItems", function (done) {
            options = {
                method: 'GET',
                uri: base_uri + '/cfgItems?page=1&per_page=2',
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.data.results.length, 2);
                done();
            });
        });

        it("query user by alias", function (done) {
            options = {
                method: 'GET',
                uri: base_uri + '/users?keyword=' + user_alias + '&page=1&per_page=10',
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.data.results[0].alias, user_alias);
                done();
            });
        });

        it("query itservice by name", function (done) {
            options = {
                method: 'GET',
                uri: base_uri + '/it_services/service?keyword=' + it_service_with_rel.data.fields.name + '&page=1&per_page=10',
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.data.results[0].name, it_service_with_rel.data.fields.name);
                done();
            });
        });

        it("query itservice by description", function (done) {
            options = {
                method: 'GET',
                uri: base_uri + '/it_services/service?keyword=' + it_service_with_rel.data.fields.desc + '&page=1&per_page=10',
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.data.results[0].desc, it_service_with_rel.data.fields.desc);
                done();
            });
        });

        it("query center itservice which has all kinds of relationship", function (done) {
            options = {
                method: 'GET',
                uri: base_uri + '/it_services/service/' + service_id,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.data.parent.uuid, service_1_id);
                assert.equal(result.data.children[0].uuid, service_2_id);
                assert.equal(result.data.dependencies[0].uuid, service_3_id);
                assert.equal(result.data.dependendents[0].uuid, service_4_id);
                done();
            });
        });

        it("query itservice-2 which only has a parent relationship", function (done) {
            options = {
                method: 'GET',
                uri: base_uri + '/it_services/service/' + service_2_id,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.data.parent.uuid, service_id);
                done();
            });
        });

        it("query schema for Router and all it's inheritance", function (done) {
            options = {
                method: 'GET',
                uri: base_uri + '/schema/Router/',
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.id, '/Router');
                assert.equal(result.allOf[0].id, '/NetworkDevice');
                assert.equal(result.allOf[0].allOf[0].id, '/Hardware');
                assert.equal(result.allOf[0].allOf[0].allOf[0].id, '/Asset');
                assert.equal(result.allOf[0].allOf[0].allOf[0].allOf[0].id, '/ConfigurationItem');
                done();
            });
        });

        it("query it_service_group with hierarchy", function (done) {
            options = {
                method: 'GET',
                uri: base_uri + '/it_services/group/',
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.data.length,3);
                result.data.forEach(function(group) {
                    if(group.group.uuid === group_1_id){ //group-1 has 1 service instance
                        assert.equal(group.services.length,1);
                    }else if(group.group.uuid === group_2_id){　//group-2 has 4 service instances
                        assert.equal(group.services.length,4);
                    }else if(group.group.uuid === group_3_id){//group-3 has no service instance
                        assert.equal(group.services.length,0);
                    }
                });
                done();
            });
        });

        it("query process_flow by keyword matched", function (done) {
            options = {
                method: 'GET',
                uri: base_uri + '/processFlows?keyword='+match_word,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.hits.hits.length, 1);
                done();
            });
        });

        it("query process_flow by keyword not matched", function (done) {
            options = {
                method: 'GET',
                uri: base_uri + '/processFlows?keyword='+unmatch_word,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.hits.hits.length, 0);
                done();
            });
        });

    });

    describe("delete test cases", function() {

        describe("delete one cfgItem and check if total count decreased by one", function() {
            it("delete cfgItem by uuid", function (done) {
                options = {
                    method: 'DELETE',
                    uri: base_uri + '/cfgItems/' + camera_id,
                    json: true
                };
                rp(options).then(function (result) {
                    console.log(JSON.stringify(result,null,3));
                    assert.equal(result.uuid, camera_id);
                    done();
                });
            });

            it("query all cfgItems and now total count should be decreased by one", function (done) {
                options = {
                    method: 'GET',
                    uri: base_uri + '/cfgItems',
                    json: true
                };
                rp(options).then(function (result) {
                    console.log(JSON.stringify(result,null,3));
                    assert.equal(result.data.count, cmdbs.length - 1);
                    done();
                });
            });
        });

        describe("delete one service which is child of center service and check if relationship in center service also changed", function() {
            it("delete itservice-2", function (done) {
                options = {
                    method: 'DELETE',
                    uri: base_uri + '/it_services/service/' + service_2_id,
                    json: true
                };
                rp(options).then(function (result) {
                    console.log(JSON.stringify(result,null,3));
                    assert.equal(result.status, 'info');
                    done();
                });
            });

            it("query center itservice again and now it does not have any child", function (done) {
                options = {
                    method: 'GET',
                    uri: base_uri + '/it_services/service/' + service_id,
                    json: true
                };
                rp(options).then(function (result) {
                    console.log(JSON.stringify(result,null,3));
                    assert.equal(result.data.parent.uuid, service_1_id);
                    assert.equal(result.data.children.length, 0);
                    assert.equal(result.data.dependencies[0].uuid, service_3_id);
                    assert.equal(result.data.dependendents[0].uuid, service_4_id);
                    done();
                });
            });
        });
    });



    describe("exception test cases", function() {

        it("delete cfgItem by uuid which does not exist", function (done) {
            options = {
                method: 'DELETE',
                uri: base_uri + '/cfgItems/' + NOT_EXIST_ID,
                json: true
            };
            rp(options).then(function (result) {
                console.log(JSON.stringify(result,null,3));
                assert.equal(result.status, 'warn');
                done();
            });
        });
    })


});