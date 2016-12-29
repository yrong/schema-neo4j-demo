MATCH
    (n:ConfigurationItem)
WITH
    count(n) AS cnt
MATCH
    (n:ConfigurationItem)
WITH
    n, cnt
SKIP {skip} LIMIT {limit}
RETURN
    { cnt: cnt, nodes:collect(n) }
