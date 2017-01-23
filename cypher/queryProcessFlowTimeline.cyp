match p=(current:ProcessFlow {uuid:{uuid}})-[:PREV*]->()
WITH COLLECT(p) AS paths, MAX(length(p)) AS maxLength
RETURN FILTER(path IN paths WHERE length(path)= maxLength) AS longestPaths