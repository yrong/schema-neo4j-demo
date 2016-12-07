#! /bin/bash

npm run sync

curl -X POST --header "Content-Type: application/json" --url "http://localhost:3000/api/cabinets" -d @./testdata/cabinet.json

