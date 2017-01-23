MATCH ()<-[r2:LOCATED|SUPPORT_SERVICE]-(n:ConfigurationItem{uuid: {uuid}})<-[r1:RESPONSIBLE_FOR]-()
DELETE r1,r2
return r1,r2