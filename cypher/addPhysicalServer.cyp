MERGE (server:PhysicalServer:AbstractServer:ConfigurationItem:Hardware:Asset {uuid: {fields}.uuid})
ON CREATE SET server = {fields},server.created = timestamp()
ON MATCH SET server = {fields},server.lastUpated = timestamp()
RETURN server
