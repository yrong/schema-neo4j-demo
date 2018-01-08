MATCH (s:ITService)-[r:BelongsTo]->(sg:ITServiceGroup)
CREATE (s)-[r1:MemberOf]->(sg)
SET r1 = r
WITH r
DELETE r;

MATCH (c:Cabinet)-[r:LocatedAt]->(s:ServerRoom)
CREATE (c)-[r1:MemberOf]->(s)
SET r1 = r
WITH r
DELETE r;

MATCH (s:Shelf)-[r:LocatedAt]->(w:WareHouse)
CREATE (s)-[r1:MemberOf]->(w)
SET r1 = r
WITH r
DELETE r;

return "upgrade success" as upgrade_result;