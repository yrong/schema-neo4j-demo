UNWIND {reference_process_flow} as reference_id
MATCH (n:ProcessFlow{uuid:{uuid}})
MATCH (rn:ProcessFlow{uuid:reference_id})
CREATE (n)-[:REFERENCED_PROCESSFLOW]->(rn)
