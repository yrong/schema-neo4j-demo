MERGE (server:VirtualServer:AbstractServer:ConfigurationItem {uuid: {fields}.uuid})
ON CREATE SET server = {fields},server.created = timestamp()
ON MATCH SET server = {fields},server.lastUpated = timestamp()
RETURN server
