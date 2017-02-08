#! /bin/bash

usage() { echo "Usage: $0 [--service_only ] --dir=20170123000348" 1>&2; exit 1; }

service_only=0

while [ "$1" != "" ]; do
    PARAM=`echo $1 | awk -F= '{print $1}'`
    VALUE=`echo $1 | awk -F= '{print $2}'`
    case $PARAM in
        -h | --help)
            usage
            exit
            ;;
        --service_only)
            service_only=1
            ;;
        --dir)
            date_dir=$VALUE
            ;;
        *)
            echo "ERROR: unknown parameter \"$PARAM\""
            usage
            exit 1
            ;;
    esac
    shift
done

if [ -z "$date_dir" ]; then
        usage
        exit
fi

storeDir=$(cat ./config/default.json|./script/jq-linux64 '.config.export.storeDir'| sed -e 's/^"//' -e 's/"$//')
esHost=$(cat ./config/default.json|./script/jq-linux64 '.config.elasticsearch.host'| sed -e 's/^"//' -e 's/"$//')
esPort=$(cat ./config/default.json|./script/jq-linux64 '.config.elasticsearch.port')
esIndex=$(cat ./config/default.json|./script/jq-linux64 '.config.elasticsearch.index'| sed -e 's/^"//' -e 's/"$//')

if [ $service_only -eq 0 ]; then
    #$NEO4J_HOME/bin/neo4j-shell -file ./cypher/dropSchema.cyp
    curl -X DELETE --header "Content-Type: application/json" --url "http://localhost:3001/api/items"
    cat $storeDir/$date_dir/neo4j.dump | $NEO4J_HOME/bin/neo4j-shell
    elasticdump \
      --input=$storeDir/$date_dir/es.dump \
      --output=http://$esHost:$esPort/$esIndex \
      --type=data
    if [ $? -eq 0 ]; then
        echo "importing data successfully!"
    fi
else
   node ./import/index.js ITService $date_dir
fi





