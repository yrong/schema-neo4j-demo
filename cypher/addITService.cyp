MERGE (n:ITService {uuid: {uuid}})
ON CREATE SET n = {fields}
ON MATCH SET n = {fields}
RETURN n