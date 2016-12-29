MATCH
    (n:ITService)
WHERE n.name =~ {keyword} OR n.desc =~ {keyword}
SKIP {skip} LIMIT {limit}
RETURN collect(n)
