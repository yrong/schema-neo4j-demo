MATCH ()<-[r2:LOCATED|SUPPORT]-(n{uuid: {uuid}})<-[r1:RESPONSIBLE_FOR]-()
DELETE r1,r2