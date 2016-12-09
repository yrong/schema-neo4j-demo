MERGE (n:Location {uuid: {uuid}})
ON CREATE SET n = {fields},n.uuid={uuid}
ON MATCH SET n = {fields},n.uuid={uuid}
RETURN n