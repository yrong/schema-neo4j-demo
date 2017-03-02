MATCH (:ConfigurationItem)-[r:LOCATED]->(:Cabinet)
return COLLECT( distinct r)