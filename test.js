let rp = require('request-promise');

let base_uri = 'http://localhost:3000/api',userid=1,result,options,cabinet_id,location_id,
    service_1_id,service_2_id,service_3_id,service_4_id,service_group_id,service_id

let it_service = require('./testdata/it_service_with_rel.json');

let physical_server = require('./testdata/physical_server.json');

let router = require('./testdata/router.json');

let storage = require('./testdata/storage.json');

let virtual_server = require('./testdata/virtual_server.json');

let camera = require('./testdata/camera.json');


(async function() {
    try {
        //clear all items in db
        options = {
            method: 'DELETE',
            uri: base_uri+'/items'
        };
        result = await rp(options);
        console.log(result);

        //sync user from mysql
        require('./sync');

        //add Cabinet
        options = {
            method: 'POST',
            uri: base_uri+'/cabinets',
            body: require('./testdata/cabinet.json'),
            json: true
        };
        result = await rp(options);
        console.log(result);
        cabinet_id = result.uuid;

        //add Location
        options = {
            method: 'POST',
            uri: base_uri+'/locations',
            body: require('./testdata/location.json'),
            json: true
        };
        result = await rp(options);
        console.log(result);
        location_id = result.uuid;


        //add ServiceGroup
        options = {
            method: 'POST',
            uri: base_uri+'/it_services/group',
            body: require('./testdata/it_service_group.json'),
            json: true
        };
        result = await rp(options);
        console.log(result);
        service_group_id = result.uuid;

        //add Service1
        options = {
            method: 'POST',
            uri: base_uri+'/it_services/service',
            body: require('./testdata/it_service.json'),
            json: true
        };
        result = await rp(options);
        console.log(result);
        service_1_id = result.uuid;
        //add Service2
        options = {
            method: 'POST',
            uri: base_uri+'/it_services/service',
            body: require('./testdata/it_service.json'),
            json: true
        };
        result = await rp(options);
        console.log(result);
        service_2_id = result.uuid;
        //add Service3
        options = {
            method: 'POST',
            uri: base_uri+'/it_services/service',
            body: require('./testdata/it_service.json'),
            json: true
        };
        result = await rp(options);
        console.log(result);
        service_3_id = result.uuid;
        //add Service4
        options = {
            method: 'POST',
            uri: base_uri+'/it_services/service',
            body: require('./testdata/it_service.json'),
            json: true
        };
        result = await rp(options);
        console.log(result);
        service_4_id = result.uuid;

        //add center it_service which related to others
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
        result = await rp(options);
        console.log(result);
        service_id = result.uuid;

        //add camera
        camera.data.fields.it_service = service_id;
        camera.data.fields.asset_location.cabinet = cabinet_id;

        options = {
            method: 'POST',
            uri: base_uri+'/cfgItems',
            body: camera,
            json: true
        };
        result = await rp(options);
        console.log(result);

        //query cases
        process.exit(0);



    } catch (e) {
        console.log(e);
        process.exit(-1);
    }
})();




options = {
    method: 'POST',
    uri: 'http://localhost:3000/api/cabinets',
    body: require('./testdata/cabinet.json'),
    json: true // Automatically parses the JSON string in the response
};
