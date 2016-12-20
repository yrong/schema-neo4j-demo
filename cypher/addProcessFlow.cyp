MERGE (n:ProcessFlow {uuid: {uuid}})
ON CREATE SET n = {fields},n.uuid={uuid},n.created = timestamp()
ON MATCH SET n = {fields},n.uuid={uuid},n.lastUpated = timestamp()
MERGE (s:ITService {uuid:{it_service}})
MERGE (n)-[r:AFFECTED]->(s)
return n

