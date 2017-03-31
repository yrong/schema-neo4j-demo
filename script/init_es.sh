#! /bin/bash

echo $'delete index'
curl -XDELETE 'http://localhost:9200/cmdb,processflow/'
echo $'\n\ncreate cmdb index and add schema in es'
curl --header "Content-Type: application/json" -XPUT 'http://localhost:9200/cmdb/' -d @./search/cmdb.json
echo $'\n\ncreate processflow index and add schema in es'
curl --header "Content-Type: application/json" -XPUT 'http://localhost:9200/processflow/' -d @./search/processflow.json
