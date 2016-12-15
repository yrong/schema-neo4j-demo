MERGE (n:PhysicalServer:AbstractServer:ConfigurationItem:Hardware:Asset {uuid: {uuid}})
ON CREATE SET n = {fields},n.uuid={uuid},n.created = timestamp()
ON MATCH SET n = {fields},n.uuid={uuid},n.lastUpated = timestamp()
RETURN n
