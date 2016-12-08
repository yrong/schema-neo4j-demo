MERGE (n:Location {uuid: {uuid}})
ON CREATE SET n = {fields}
ON MATCH SET n = {fields}
RETURN n