#! /bin/bash

npm run sync

curl -X POST --header "Content-Type: application/json" --url "http://localhost:3000/api/it_services" -d @./testdata/it_service.json

curl -X POST --header "Content-Type: application/json" --url "http://localhost:3000/api/locations" -d @./testdata/location.json

curl -X POST --header "Content-Type: application/json" --url "http://localhost:3000/api/cabinets" -d @./testdata/cabinet.json


