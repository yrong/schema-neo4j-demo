MATCH (s)
WHERE s.uuid = {uuid}
DETACH
DELETE s
return s