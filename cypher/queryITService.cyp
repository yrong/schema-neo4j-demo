MATCH
    (n:ITService)
WITH
    count(n) AS cnt
MATCH
    (n:ITService)
WITH
    n, cnt
SKIP {skip} LIMIT {limit}
RETURN
    { cnt: cnt, nodes:collect(n) }
