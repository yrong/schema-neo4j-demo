MATCH ()<-[r1:BelongsTo|ParentOf|DependsOn]-(n:ITService{uuid: {uuid}})<-[r2:ParentOf|DependsOn]-()
DELETE r1,r2
