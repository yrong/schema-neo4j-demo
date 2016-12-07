MERGE (n:ITService {uuid: {fields}.uuid})
ON CREATE SET n = {fields}
ON MATCH SET n = {fields}
RETURN n