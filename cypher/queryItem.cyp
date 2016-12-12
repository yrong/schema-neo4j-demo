MATCH
    (n)
WHERE n.uuid = {uuid}
WITH
    count(n) AS cnt,n as n
RETURN
    { cnt: cnt, nodes:collect(n) }
