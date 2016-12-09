MERGE (n:VirtualServer:AbstractServer:ConfigurationItem {uuid: {uuid}})
ON CREATE SET n = {fields},n.uuid={uuid},n.created = timestamp()
ON MATCH SET n = {fields},n.uuid={uuid},n.lastUpated = timestamp()
