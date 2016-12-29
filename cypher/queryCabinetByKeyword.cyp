MATCH
    (n:Cabinet)
WHERE n.name =~ {keyword} OR n.desc =~ {keyword}
RETURN collect(n)
