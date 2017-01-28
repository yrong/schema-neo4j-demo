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
            dir=$VALUE
            ;;
        *)
            echo "ERROR: unknown parameter \"$PARAM\""
            usage
            exit 1
            ;;
    esac
    shift
done

if [ -z "$dir" ]; then
        usage
        exit
fi

if [ $service_only -eq 0 ]; then
    #$NEO4J_HOME/bin/neo4j-shell -file ./cypher/dropSchema.cyp
    curl -X DELETE --header "Content-Type: application/json" --url "http://localhost:3001/api/items"
    cat ./data/$dir/neo4j.dump | $NEO4J_HOME/bin/neo4j-shell
    elasticdump \
      --input=./data/$dir/es.dump \
      --output=http://localhost:9200/cmdb \
      --type=data
    if [ $? -eq 0 ]; then
        echo "importing data successfully!"
    fi
else
   node ./importItService.js $dir
fi





