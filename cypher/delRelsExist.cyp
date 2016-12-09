MATCH ()<-[r2:LOCATED]-(n{uuid: {uuid}})<-[r1:RESPONSIBLE_FOR]-()
DELETE r1,r2
WITH n as n
MATCH ()<-[r3:SUPPORT]-(n)
DELETE r3