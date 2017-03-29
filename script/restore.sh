#! /bin/bash

usage() { echo "Usage: $0 --dir=./export_data/20170123000348" 1>&2; exit 1; }

while [ "$1" != "" ]; do
    PARAM=`echo $1 | awk -F= '{print $1}'`
    VALUE=`echo $1 | awk -F= '{print $2}'`
    case $PARAM in
        -h | --help)
            usage
            exit
            ;;
        --dir)
            storeDir=$VALUE
            ;;
        *)
            echo "ERROR: unknown parameter \"$PARAM\""
            usage
            exit 1
            ;;
    esac
    shift
done

if [ -z "$storeDir" ]; then
        usage
        exit
fi

curl -X DELETE --header "Content-Type: application/json" --url "http://localhost:3001/api/items"
cat $storeDir/neo4j.dump | $NEO4J_HOME/bin/neo4j-shell





