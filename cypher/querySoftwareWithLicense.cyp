MATCH (s:Software) WHERE s.uuid={uuid}
OPTIONAL MATCH (l:License)-[:LICENSED_TO]->(s)
return {software:s,license:(collect(distinct(l)))}