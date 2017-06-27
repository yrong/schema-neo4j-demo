A [CMDB](https://en.wikipedia.org/wiki/Configuration_management_database) backend implementation built with [Neo4j](http://vertx.io/vertx2/), [ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/master/getting-started.html).

## Features

* relationship modeling in neo4j
* json schema definition and verification
* configuration driven restful api
* hooks/callbacks/lifecycle for crud operation
* node cache storing frequently used data
* export/import/backup/restore,multiple import format(excel/json),error recording during import
* license publishing and verification

## 3rd lib

```
"dependencies": {
    "ajv": "^4.9.0",
    "canvas": "^1.6.5",
    "cmdb-license-checker": "^1.0.4",
    "config": "^1.24.0",
    "elasticsearch": "^12.1.3",
    "file-system": "^2.2.2",
    "jsbarcode": "^3.5.9",
    "jsonfile": "^2.4.0",
    "jsonpath": "^0.2.11",
    "kcors": "^2.1.1",
    "koa": "^2.0.0",
    "koa-bodyparser": "^3.2.0",
    "koa-logger": "^2.0.0",
    "koa-mount": "^2.0.0",
    "koa-neo4j": "^1.2.0",
    "koa-passport": "^2.2.2",
    "koa-router": "^7.0.1",
    "koa-socket": "^4.4.0",
    "koa-static": "^2.1.0",
    "koa2-file-upload-local": "^1.0.1",
    "log4js": "^1.1.1",
    "moment": "^2.17.1",
    "node-cache": "^4.1.1",
    "qrcode": "^0.8.1",
    "request-promise": "^4.1.1",
    "uuid": "^3.0.1",
    "uuid-validate": "0.0.2",
    "xlsx": "^0.8.1"
  },
```

## Primary Relationships Modeling

```
(:ITServiceGroup)<-[:BelongsTo]-(:ITService)
(:ITService)-[:ParentOf]->(:ITService)
(:ITService)-[:DependsOn]->(:ITService)
(:Cabinet)-[:LOCATED_AT]->(:ServerRoom)
(:Shelf)-[:LOCATED_AT]->(:WareHouse)
(:ConfigurationItem)-[:LOCATED_AT]->(:Cabinet|Shelf)
(:ConfigurationItem)-[:SUPPORT_SERVICE]->(:ITService)
(:ConfigurationItem)<-[:RESPONSIBLE_FOR]-(:User)
(:ConfigurationItem)-[:PREV]->(:ConfigurationItemPrev)//to describe change history of ConfigurationItem
```

## Data Stored in Neo4j

```
begin
create constraint on (n:`Cabinet`) assert n.`name` is unique;
create constraint on (n:`ConfigurationItem`) assert n.`name` is unique;
create constraint on (n:`ITServiceGroup`) assert n.`name` is unique;
create constraint on (n:`ITService`) assert n.`name` is unique;
create constraint on (n:`Position`) assert n.`name` is unique;
create constraint on (n:`ServerRoom`) assert n.`name` is unique;
create constraint on (n:`Shelf`) assert n.`name` is unique;
create constraint on (n:`User`) assert n.`alias` is unique;
create constraint on (n:`User`) assert n.`uuid` is unique;
create constraint on (n:`WareHouse`) assert n.`name` is unique;
commit
begin
create (_435:`ITService` {`category`:"ITService", `created`:1493103156904.000000, `description`:"pop3", `group`:"c2e19df0-2983-11e7-8afb-937f9d31ef06", `name`:"pop3", `parent`:"c3a0cf40-2983-11e7-8afb-937f9d31ef06", `uuid`:"c44ec280-2983-11e7-8afb-937f9d31ef06"})
create (_437:`ITService` {`category`:"ITService", `created`:1493103157597.000000, `dependendents`:["c3a0cf40-2983-11e7-8afb-937f9d31ef06"], `description`:"dns2", `group`:"c342d0c0-2983-11e7-8afb-937f9d31ef06", `lastUpdated`:1493103158269.000000, `name`:"dns", `uuid`:"c4b880d0-2983-11e7-8afb-937f9d31ef06"})
create (_438:`ITServicePrev` {`category`:"ITService", `created`:1493103157597.000000, `dependendents`:["c3a0cf40-2983-11e7-8afb-937f9d31ef06"], `description`:"dns", `group`:"c342d0c0-2983-11e7-8afb-937f9d31ef06", `name`:"dns", `uuid`:"c4b880d0-2983-11e7-8afb-937f9d31ef06"})
create (_439:`Sequence` {`current`:4, `name`:"ConfigurationItem"})
create (_440:`ITServiceGroup` {`category`:"ITServiceGroup", `created`:1493103155148.000000, `description`:"Infrastructure", `name`:"Infrastructure", `uuid`:"c342d0c0-2983-11e7-8afb-937f9d31ef06"})
create (_441:`ITServiceGroup` {`category`:"ITServiceGroup", `created`:1493103154511.000000, `description`:"Messaging", `name`:"Messaging", `uuid`:"c2e19df0-2983-11e7-8afb-937f9d31ef06"})
create (_442:`ConfigurationItem`:`Router`:`NetworkDevice`:`Hardware`:`Asset` {`asset_location`:"{\"status\":\"mounted\",\"u\":42,\"date_mounted\":\"2016-06-28\",\"cabinet\":\"c13c2b50-2983-11e7-8afb-937f9d31ef06\"}", `barcode`:"{\"id\":1,\"url\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAACOCAYAAADpeIwiAAAABmJLR0QA/wD/AP+gvaeTAAACNklEQVR4nO3asYkCQRxG8W8PUy3AKgwswBJMjQ3EBqzCAowEsRnF0MjUBixhLjI4QRRPb3h77wcGLrPDHx7D4mJTSikR1lftAfQ7BoQzIJwB4QwIZ0A4A8IZEM6AcJ1nFzZN8+P79QXO9frtC5171+/te+/+W4/W3c717H2P1j2777P7v7rvLU8gnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAjXlFJK7SH0Ok8gnAHhDAhnQDgDwhkQzoBwrQu42+2yWCwyGo3S6/XSNE0mk0ntsT6mU3uAd9tsNlmtVul2u+n3+zmdTrVH+qjWncDpdJrj8ZjL5ZLlcll7nI9r3QkcDoe1R/hTrTuB/40B4QwIZ0A4A8IZEM6AcAaEa90P+f1+n/V6nSQ5n89JksPhkNlsliQZDAaZz+fV5nu70jLb7bYkufsZj8e1R3wr/5UG5zMQzoBwBoQzIJwB4QwIZ0A4A8IZEO4b7zD7n7WzVd0AAAAASUVORK5CYII=\"}", `category`:"Router", `created`:1493103159806.000000, `geo_location`:"{\"name\":\"beijing\",\"location\":{\"lat\":39.98,\"lon\":116.3}}", `it_service`:["c4b880d0-2983-11e7-8afb-937f9d31ef06"], `lastUpdated`:1493103162835.000000, `model`:"a10", `monitored`:false, `name`:"router", `product_date`:"2016-08-11", `responsibility`:1.000000, `sn`:"123456", `status`:"{\"status\":\"In_Use\",\"fields\":{\"a\":1}}", `uuid`:"c604fe00-2983-11e7-8afb-937f9d31ef06", `warranty_expiration_date`:"2016-11-11"})
create (_443:`ConfigurationItem`:`Hardware`:`Asset`:`PhysicalServer`:`AbstractServer` {`asset_location`:"{\"status\":\"on_shelf\",\"shelf\":\"c247f600-2983-11e7-8afb-937f9d31ef06\",\"label\":\"label\",\"other\":\"other\"}", `barcode`:"{\"id\":2,\"url\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAACOCAYAAADpeIwiAAAABmJLR0QA/wD/AP+gvaeTAAAC/UlEQVR4nO3YsS4sYRiH8XcOhRCJRK+QSLYUCb2oFUKnYJO9AyE6FyBUCqGUuAIXQaUUtVooZLvxnkrhhMNxdnx5xvPrdnzZ/OXJZHenyswMYf0qPUD/x4BwBoQzIJwB4QwIZ0A4A8IZEG74swerqnr1+uUBzsv1Px/ovHf9s+/73t8/Ovfnrq+e/+ye9/6/j97vX/e+xzsQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoSrMjNLj9DXeQfCGRDOgHAGhDMgnAHhDAjXqoBPT09xdnYWy8vLMT09HaOjozEzMxNra2txeXlZel4zskVOT08zInJkZCTn5uZyZWUlZ2dnMyJyaGgoz8/PS08cuFYFvLi4yP39/Xx8fHx1/fj4OCMiJyYmst/vF1rXjB/zKG1qairu7u7i6uoqFhYWSs8ZmFZ9Bv7N2NhYRESMj48XXjJYPyLg9fV13N7eRqfTiU6nU3rOQLU+YL/fj/X19aiqKo6OjqKqqtKTBmq49IAm1XUd3W43bm5u4uDgIJaWlkpPGrzS36Ka8vz8nL1eLyMi9/b2Ss9pTCsD1nWd3W43IyJ3d3dLz2lU6wLWdZ2bm5sZEbm9vV16TuNaFbCu69zY2MiIyJ2dndJzvkWrfsgfHh7G1tZWTE5Oxurq6ptner1ezM/Pf/Oy5rTqW+jDw0NERNzf38fJycmbZxYXF1sVsFV34E/U+h/ybWdAOAPCGRDOgHAGhDMgnAHhDAj3G/t1rZSNDFKQAAAAAElFTkSuQmCC\"}", `category`:"PhysicalServer", `created`:1493103160560.000000, `ip_address`:["10.10.35.63"], `it_service`:["c3a0cf40-2983-11e7-8afb-937f9d31ef06", "c44ec280-2983-11e7-8afb-937f9d31ef06"], `management_ip`:["10.10.35.64"], `model`:"b10", `monitored`:true, `name`:"physicalserver2", `operating_system`:"ubuntu", `product_date`:"2016-10-11", `storage_info`:"hp-disk1", `technical_support_info`:"010-123456", `uuid`:"c67b8d90-2983-11e7-8afb-937f9d31ef06", `warranty_expiration_date`:"2016-11-11"})
create (_444:`ConfigurationItem`:`NetworkDevice`:`Hardware`:`Asset`:`Switch` {`asset_location`:"{\"status\":\"mounted\",\"u\":42,\"date_mounted\":\"2016-06-28\",\"cabinet\":\"c13c2b50-2983-11e7-8afb-937f9d31ef06\"}", `barcode`:"{\"id\":3,\"url\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAACOCAYAAADpeIwiAAAABmJLR0QA/wD/AP+gvaeTAAADW0lEQVR4nO3YsUojURiG4W8WhaAQsQ1ikVELwVYQIQjaKWLjDVjpFVh5DxZiLVYKegFaCEECYiOmsZGANmoaQVKkUM5WCkZEd3eyh298n26GmcMPL2cmkySEEARbv2IPgH9DQHMENEdAcwQ0R0BzBDRHQHMENNfz3QuTJHl3/PoHzuv5zj90Pjv/3XU/W6fz+q/u++66n93Xef9X6/7pOn+6bid2oDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOgOQKaI6A5ApojoDkCmiOguSSEEGIPgb/HDjRHQHMENEdAcwQ0R0BzBDSXq4DNZlPr6+uqVCoqlUoqFAoql8taXFzUyclJ7PG6Ilcf8mdnZ5qamlKapkrTVAMDA7q/v1etVlMIQdvb21pdXY09ZqZyFfDp6UmtVkulUund+fPzc1UqFfX29urh4UF9fX2RJsxerh6hxWLxQzxJmpyc1Pj4uFqtlhqNRoTJuidXAT9zeXmpq6srFQoFDQ8Pxx4nUz2xB+iGZrOpjY0NPT8/6+bmRtVqVSEEbW5uqlgsxh4vU7l6B766vr7W6Ojo2/Hg4KB2d3e1sLAQcaruyOUjdGRkRCEEtdtt1et1zc/Pa2lpSVtbW7FHy1wud2CnEILm5uZUrVZ1cXGhiYmJ2CNlJpc7sFOSJJqdndXLy4uOj49jj5OpHxFQkm5vbyVJ7XY78iTZylXAg4MD1ev1D+ePjo60s7MjSZqZmfm/Q3VZrj4jDg8Ptbe3pzRNVS6X1d/fr0aj8RZ1bW1N09PTkafMVq5+xJyenmp/f1+1Wk13d3d6fHzU0NCQxsbGtLKyouXl5dgjZi5XAX+iXL0DfyICmiOgOQKaI6A5ApojoDkCmiOgud+F+9Qpxa02CQAAAABJRU5ErkJggg==\"}", `category`:"Switch", `created`:1493103161233.000000, `it_service`:["c4b880d0-2983-11e7-8afb-937f9d31ef06"], `model`:"a10", `monitored`:false, `name`:"switch", `product_date`:"2016-10-11", `responsibility`:1.000000, `sn`:"123456", `uuid`:"c6e21790-2983-11e7-8afb-937f9d31ef06", `warranty_expiration_date`:"2016-11-11"})
create (_445:`ConfigurationItem`:`NetworkDevice`:`Hardware`:`Asset`:`Firewall` {`asset_location`:"{\"status\":\"on_shelf\",\"shelf\":\"c247f600-2983-11e7-8afb-937f9d31ef06\",\"label\":\"label\",\"other\":\"other\"}", `barcode`:"{\"id\":4,\"url\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAACOCAYAAADpeIwiAAAABmJLR0QA/wD/AP+gvaeTAAAClUlEQVR4nO3ZMWpiURxG8f+VgFap7AQrU4quxNrOYOESrKwCaqkLyVIsFEQIcQcBVyC8qVJMBlEmeT7Ozfl1Poz55ORq0FQURRHCqlU9QN9jQDgDwhkQzoBwBoQzIJwB4QwI93DrHVNKf93+/ADn8/rXD3QuXb/1ca89ztefu7Tr2vXv/t5Lz+/Wfdf2XuMJhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhUlEURdUj9P88gXAGhDMgnAHhDAhnQDgDwmUfcLFYREopUkpxPB6rnvPjsg643+/j5eUl6vV61VNKk23A8/kc4/E4BoNBPD09VT2nNNkGXC6X8fb2FqvVquoppXqoekAZDodDzOfzWK/X0Wq1qp5TquxO4Pl8jtFoFP1+PyaTSdVzSpfdCZzP57HdbmOz2UStlt3f5z+yeoa73S4Wi0VMp9Po9XpVz7mLrAI+Pz9Hu92O2WxW9ZS7yeoL3ZTSTff7+PiIZrNZ8pr7yOo98NI/La+vr3E6nWI4HMbj42M0Go07LytPVifwkm63G/v9Pt7f36PT6VQ950dl9R74GxkQ7le8hObMEwhnQDgDwhkQzoBwBoQzIJwB4QwI9wd9k3sJr0Cb1gAAAABJRU5ErkJggg==\"}", `category`:"Firewall", `created`:1493103161912.000000, `it_service`:["c4b880d0-2983-11e7-8afb-937f9d31ef06"], `model`:"b10", `monitored`:false, `name`:"firewall", `product_date`:"2016-10-11", `responsibility`:1.000000, `sn`:"123456", `uuid`:"c74964e0-2983-11e7-8afb-937f9d31ef06", `warranty_expiration_date`:"2016-11-11"})
create (_446:`ConfigurationItemPrev` {`asset_location`:"{\"status\":\"mounted\",\"u\":42,\"date_mounted\":\"2016-06-28\",\"cabinet\":\"c13c2b50-2983-11e7-8afb-937f9d31ef06\",\"test\":\"test\"}", `barcode`:"{\"id\":1,\"url\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAACOCAYAAADpeIwiAAAABmJLR0QA/wD/AP+gvaeTAAACNklEQVR4nO3asYkCQRxG8W8PUy3AKgwswBJMjQ3EBqzCAowEsRnF0MjUBixhLjI4QRRPb3h77wcGLrPDHx7D4mJTSikR1lftAfQ7BoQzIJwB4QwIZ0A4A8IZEM6AcJ1nFzZN8+P79QXO9frtC5171+/te+/+W4/W3c717H2P1j2777P7v7rvLU8gnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAjXlFJK7SH0Ok8gnAHhDAhnQDgDwhkQzoBwrQu42+2yWCwyGo3S6/XSNE0mk0ntsT6mU3uAd9tsNlmtVul2u+n3+zmdTrVH+qjWncDpdJrj8ZjL5ZLlcll7nI9r3QkcDoe1R/hTrTuB/40B4QwIZ0A4A8IZEM6AcAaEa90P+f1+n/V6nSQ5n89JksPhkNlsliQZDAaZz+fV5nu70jLb7bYkufsZj8e1R3wr/5UG5zMQzoBwBoQzIJwB4QwIZ0A4A8IZEO4b7zD7n7WzVd0AAAAASUVORK5CYII=\"}", `category`:"Router", `created`:1493103159806.000000, `geo_location`:"{\"name\":\"beijing\",\"location\":{\"lat\":39.98,\"lon\":116.3}}", `it_service`:["c4b880d0-2983-11e7-8afb-937f9d31ef06"], `model`:"a10", `monitored`:false, `name`:"router", `product_date`:"2016-08-11", `responsibility`:1.000000, `sn`:"123456", `status`:"{\"status\":\"In_Use\",\"fields\":{\"a\":1}}", `uuid`:"c604fe00-2983-11e7-8afb-937f9d31ef06", `warranty_expiration_date`:"2016-11-11"})
create (_448:`ConfigurationItemPrev` {`asset_location`:"{\"status\":\"mounted\",\"u\":42,\"date_mounted\":\"2016-06-28\",\"cabinet\":\"c13c2b50-2983-11e7-8afb-937f9d31ef06\",\"test\":\"test\"}", `barcode`:"{\"id\":1,\"url\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAACOCAYAAADpeIwiAAAABmJLR0QA/wD/AP+gvaeTAAACNklEQVR4nO3asYkCQRxG8W8PUy3AKgwswBJMjQ3EBqzCAowEsRnF0MjUBixhLjI4QRRPb3h77wcGLrPDHx7D4mJTSikR1lftAfQ7BoQzIJwB4QwIZ0A4A8IZEM6AcJ1nFzZN8+P79QXO9frtC5171+/te+/+W4/W3c717H2P1j2777P7v7rvLU8gnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAhnQDgDwhkQzoBwBoQzIJwB4QwIZ0A4A8IZEM6AcAaEMyCcAeEMCGdAOAPCGRDOgHAGhDMgnAHhDAjXlFJK7SH0Ok8gnAHhDAhnQDgDwhkQzoBwrQu42+2yWCwyGo3S6/XSNE0mk0ntsT6mU3uAd9tsNlmtVul2u+n3+zmdTrVH+qjWncDpdJrj8ZjL5ZLlcll7nI9r3QkcDoe1R/hTrTuB/40B4QwIZ0A4A8IZEM6AcAaEa90P+f1+n/V6nSQ5n89JksPhkNlsliQZDAaZz+fV5nu70jLb7bYkufsZj8e1R3wr/5UG5zMQzoBwBoQzIJwB4QwIZ0A4A8IZEO4b7zD7n7WzVd0AAAAASUVORK5CYII=\"}", `category`:"Router", `created`:1493103159806.000000, `geo_location`:"{\"name\":\"beijing\",\"location\":{\"lat\":39.98,\"lon\":116.3}}", `it_service`:["c44ec280-2983-11e7-8afb-937f9d31ef06", "c4b880d0-2983-11e7-8afb-937f9d31ef06"], `lastUpdated`:1493103162594.000000, `model`:"a10", `monitored`:false, `name`:"router", `product_date`:"2016-08-11", `responsibility`:1.000000, `sn`:"12345678", `status`:"{\"status\":\"In_Use\",\"fields\":{\"a\":1}}", `uuid`:"c604fe00-2983-11e7-8afb-937f9d31ef06", `warranty_expiration_date`:"2016-11-11"})
create (_449:`Sequence` {`current`:7, `name`:"IncidentFlow"})
create (_450:`IncidentFlow`:`ProcessFlow` {`attachment`:"attachment", `category`:"IncidentFlow", `committer`:1.000000, `created`:1493103165905.000000, `description`:"Enter KING HENRY, LORD JOHN OF LANCASTER, the EARL of WESTMORELAND, SIR WALTER BLUNT, and others", `executor`:1.000000, `it_service`:["c3a0cf40-2983-11e7-8afb-937f9d31ef06", "c44ec280-2983-11e7-8afb-937f9d31ef06"], `lastUpdated`:1493103171464.000000, `note`:"note", `pfid`:"IR1", `reference_kb`:["b3806007-96d8-4e2c-968b-dae7c3ab70d8", "38c2d1e0-5383-4e4a-9b01-12210e611339"], `status`:"closed", `title`:"title", `user`:"a", `uuid`:"c9aaad70-2983-11e7-8afb-937f9d31ef06"})
create (_451:`IncidentFlow`:`ProcessFlow` {`attachment`:"attachment", `category`:"IncidentFlow", `committer`:1.000000, `created`:1493103167252.000000, `description`:"Enter KING HENRY, LORD JOHN OF LANCASTER, the EARL of WESTMORELAND, SIR WALTER BLUNT, and others", `executor`:1.000000, `it_service`:["c4b880d0-2983-11e7-8afb-937f9d31ef06"], `note`:"note", `pfid`:"IR2", `reference_kb`:["b3806007-96d8-4e2c-968b-dae7c3ab70d8", "38c2d1e0-5383-4e4a-9b01-12210e611339"], `reference_process_flow`:["c9aaad70-2983-11e7-8afb-937f9d31ef06"], `status`:"open", `title`:"title", `uuid`:"ca78abd0-2983-11e7-8afb-937f9d31ef06"})
create (_454:`IncidentFlow`:`ProcessFlow` {`attachment`:"da91c9f0-ed21-11e6-bb79-374a320b0637", `category`:"IncidentFlow", `committer`:1.000000, `created`:1493103168752.000000, `description`:"Enter KING HENRY, LORD JOHN OF LANCASTER, the EARL of WESTMORELAND, SIR WALTER BLUNT, and others", `executor`:1.000000, `it_service`:["c3a0cf40-2983-11e7-8afb-937f9d31ef06", "c44ec280-2983-11e7-8afb-937f9d31ef06"], `note`:"note", `pfid`:"IR4", `reference_kb`:["b3806007-96d8-4e2c-968b-dae7c3ab70d8", "38c2d1e0-5383-4e4a-9b01-12210e611339"], `status`:"open", `title`:"title", `uuid`:"cb5d8d90-2983-11e7-8afb-937f9d31ef06"})
create (_455:`ProcessFlowPrev` {`attachment`:"attachment", `category`:"IncidentFlow", `committer`:1.000000, `created`:1493103165905.000000, `description`:"Enter KING HENRY, LORD JOHN OF LANCASTER, the EARL of WESTMORELAND, SIR WALTER BLUNT, and others", `executor`:1.000000, `it_service`:["c3a0cf40-2983-11e7-8afb-937f9d31ef06", "c44ec280-2983-11e7-8afb-937f9d31ef06"], `note`:"note", `pfid`:"IR1", `reference_kb`:["b3806007-96d8-4e2c-968b-dae7c3ab70d8", "38c2d1e0-5383-4e4a-9b01-12210e611339"], `status`:"open", `title`:"title", `uuid`:"c9aaad70-2983-11e7-8afb-937f9d31ef06"})
create (_456:`ProcessFlowPrev` {`attachment`:"attachment", `category`:"IncidentFlow", `committer`:1.000000, `created`:1493103165905.000000, `description`:"Enter KING HENRY, LORD JOHN OF LANCASTER, the EARL of WESTMORELAND, SIR WALTER BLUNT, and others", `executor`:1.000000, `it_service`:["c3a0cf40-2983-11e7-8afb-937f9d31ef06", "c44ec280-2983-11e7-8afb-937f9d31ef06"], `lastUpdated`:1493103171174.000000, `note`:"note", `pfid`:"IR1", `reference_kb`:["b3806007-96d8-4e2c-968b-dae7c3ab70d8", "38c2d1e0-5383-4e4a-9b01-12210e611339"], `status`:"solved", `title`:"title", `user`:"a", `uuid`:"c9aaad70-2983-11e7-8afb-937f9d31ef06"})
create (_457:`IncidentFlow`:`ProcessFlow` {`attachment`:"attachment", `category`:"IncidentFlow", `created`:1493103882143.000000, `description`:"Enter KING HENRY, LORD JOHN OF LANCASTER, the EARL of WESTMORELAND, SIR WALTER BLUNT, and others", `it_service`:[], `note`:"note", `pfid`:"IR5", `status`:"open", `title`:"title", `uuid`:"74935010-2985-11e7-8afb-937f9d31ef06"})
create (_458:`IncidentFlow`:`ProcessFlow` {`attachment`:"da91c9f0-ed21-11e6-bb79-374a320b0637", `category`:"IncidentFlow", `committer`:1.000000, `created`:1493103891220.000000, `description`:"Enter KING HENRY, LORD JOHN OF LANCASTER, the EARL of WESTMORELAND, SIR WALTER BLUNT, and others", `executor`:1.000000, `it_service`:["c3a0cf40-2983-11e7-8afb-937f9d31ef06", "c44ec280-2983-11e7-8afb-937f9d31ef06"], `note`:"note", `pfid`:"IR6", `reference_kb`:["68634fec-f406-4512-8ffa-955497cc0c01"], `status`:"open", `title`:"title", `uuid`:"79fdb9f0-2985-11e7-8afb-937f9d31ef06"})
create (_459:`IncidentFlow`:`ProcessFlow` {`attachment`:"da91c9f0-ed21-11e6-bb79-374a320b0637", `category`:"IncidentFlow", `committer`:1.000000, `created`:1493103907005.000000, `description`:"Enter KING HENRY, LORD JOHN OF LANCASTER, the EARL of WESTMORELAND, SIR WALTER BLUNT, and others", `executor`:1.000000, `it_service`:["c3a0cf40-2983-11e7-8afb-937f9d31ef06", "c44ec280-2983-11e7-8afb-937f9d31ef06"], `note`:"note", `pfid`:"IR7", `reference_kb`:["68634fec-f406-4512-8ffa-955497cc0c01"], `status`:"open", `title`:"title", `uuid`:"83662c70-2985-11e7-8afb-937f9d31ef06"})
create (_461:`ITService` {`category`:"ITService", `created`:1493103155764.000000, `description`:"email", `group`:"c2e19df0-2983-11e7-8afb-937f9d31ef06", `name`:"email", `uuid`:"c3a0cf40-2983-11e7-8afb-937f9d31ef06"})
create (_467:`User` {`alias`:"nerds", `attempt_ip`:"10.50.13.69", `category`:"User", `created`:1492757274825.000000, `lang`:"en_GB", `name`:"nerds", `passwd`:"nerds", `surname`:"", `theme`:"default", `type`:1.000000, `userid`:1.000000, `uuid`:1.000000})
create (_594:`ServerRoom` {`category`:"ServerRoom", `created`:1493103151126.000000, `description`:"server_room", `name`:"server_room", `uuid`:"c0dd1b60-2983-11e7-8afb-937f9d31ef06"})
create (_597:`Cabinet` {`category`:"Cabinet", `created`:1493103151749.000000, `description`:"cabinet", `name`:"cabinet", `server_room_id`:"c0dd1b60-2983-11e7-8afb-937f9d31ef06", `uuid`:"c13c2b50-2983-11e7-8afb-937f9d31ef06"})
create (_598:`WareHouse` {`category`:"WareHouse", `created`:1493103152898.000000, `description`:"warehouse", `name`:"warehouse", `uuid`:"c1eb7e20-2983-11e7-8afb-937f9d31ef06"})
create (_599:`Shelf` {`category`:"Shelf", `created`:1493103153504.000000, `description`:"shelf", `name`:"shelf", `uuid`:"c247f600-2983-11e7-8afb-937f9d31ef06", `warehouse_id`:"c1eb7e20-2983-11e7-8afb-937f9d31ef06"})
create (_435)-[:`BelongsTo`]->(_441)
create (_437)-[:`PREV` {`description`:"dns2", `group`:"Infrastructure"}]->(_438)
create (_437)-[:`BelongsTo`]->(_440)
create (_442)-[:`PREV` {`asset_location`:"{\"status\":\"mounted\",\"u\":42,\"date_mounted\":\"2016-06-28\",\"cabinet\":\"c13c2b50-2983-11e7-8afb-937f9d31ef06\"}", `it_service`:["c4b880d0-2983-11e7-8afb-937f9d31ef06"], `model`:"a10", `product_date`:"2016-08-11", `responsibility`:1.000000, `sn`:"123456", `warranty_expiration_date`:"2016-11-11"}]->(_448)
create (_442)-[:`LOCATED` {`cabinet`:"c13c2b50-2983-11e7-8afb-937f9d31ef06", `date_mounted`:"2016-06-28", `status`:"mounted", `u`:42.000000}]->(_597)
create (_442)-[:`SUPPORT_SERVICE`]->(_437)
create (_443)-[:`LOCATED` {`label`:"label", `other`:"other", `shelf`:"c247f600-2983-11e7-8afb-937f9d31ef06", `status`:"on_shelf"}]->(_599)
create (_443)-[:`SUPPORT_SERVICE`]->(_461)
create (_443)-[:`SUPPORT_SERVICE`]->(_435)
create (_444)-[:`LOCATED` {`cabinet`:"c13c2b50-2983-11e7-8afb-937f9d31ef06", `date_mounted`:"2016-06-28", `status`:"mounted", `u`:42.000000}]->(_597)
create (_444)-[:`SUPPORT_SERVICE`]->(_437)
create (_445)-[:`LOCATED` {`label`:"label", `other`:"other", `shelf`:"c247f600-2983-11e7-8afb-937f9d31ef06", `status`:"on_shelf"}]->(_599)
create (_445)-[:`SUPPORT_SERVICE`]->(_437)
create (_448)-[:`PREV` {`it_service`:["c44ec280-2983-11e7-8afb-937f9d31ef06", "c4b880d0-2983-11e7-8afb-937f9d31ef06"], `responsibility`:1.000000, `sn`:"12345678"}]->(_446)
create (_450)-[:`PREV` {`status`:"closed"}]->(_456)
create (_450)-[:`EXECUTED_BY`]->(_467)
create (_450)-[:`COMMITTED_BY`]->(_467)
create (_450)-[:`REFERENCED_SERVICE`]->(_435)
create (_450)-[:`REFERENCED_SERVICE`]->(_461)
create (_451)-[:`EXECUTED_BY`]->(_467)
create (_451)-[:`COMMITTED_BY`]->(_467)
create (_451)-[:`REFERENCED_SERVICE`]->(_437)
create (_454)-[:`EXECUTED_BY`]->(_467)
create (_454)-[:`COMMITTED_BY`]->(_467)
create (_454)-[:`REFERENCED_SERVICE`]->(_435)
create (_454)-[:`REFERENCED_SERVICE`]->(_461)
create (_456)-[:`PREV` {`status`:"solved", `user`:"a"}]->(_455)
create (_458)-[:`EXECUTED_BY`]->(_467)
create (_458)-[:`COMMITTED_BY`]->(_467)
create (_458)-[:`REFERENCED_SERVICE`]->(_435)
create (_458)-[:`REFERENCED_SERVICE`]->(_461)
create (_459)-[:`EXECUTED_BY`]->(_467)
create (_459)-[:`COMMITTED_BY`]->(_467)
create (_459)-[:`REFERENCED_SERVICE`]->(_461)
create (_459)-[:`REFERENCED_SERVICE`]->(_435)
create (_461)-[:`DependsOn`]->(_437)
create (_461)-[:`ParentOf`]->(_435)
create (_461)-[:`BelongsTo`]->(_441)
create (_467)-[:`RESPONSIBLE_FOR`]->(_442)
create (_467)-[:`RESPONSIBLE_FOR`]->(_445)
create (_467)-[:`RESPONSIBLE_FOR`]->(_444)
create (_597)-[:`LocatedAt`]->(_594)
create (_599)-[:`LocatedAt`]->(_598)
;
commit
```

## Build and Start

### Start DB Server

>	[neo4j](http://neo4j.com/docs/operations-manual/current/installation/)

>   [elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/master/_installation.html)

### Prepare User

user data is synchronized from other data source,to avoid the dependency,just add some mock data here.

    MERGE (u:User{userid:1}) ON CREATE SET u = {autologin:1,type:3,uuid:1,attempt_ip:"10.50.13.69",userid:1,surname:"werq",name:"test",alias:"nerds",lang:"en_GB"}

### Nbi Server
    
*install npm dependencies and start nbi*

    npm install
    npm start
    

*run integration test cases with [postman](https://www.getpostman.com/docs/)*

    npm test

