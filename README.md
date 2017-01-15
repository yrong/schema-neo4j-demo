#CMDB-API

# 格式
## 查
返回所有配置项：
```
GET /API/cfgItems?page={page}&per_page={per_page}
```
若不带page和per_page参数，则返回所有结果，以下同
response: //所有分页的返回结果均为此格式
```
{
	"status":"ok", //ok, info, warning, error,
	"message":{
		"content":"message text here",
		"displayAs":"toast" //toast, modal, console, alert
	},
	"data":{
		"count":9,//所有结果总数
		"results":[ //当前页的所有成员
			{},
			{}
		]
	}
}
```
返回所有配置项类别：//可以过滤资产
```
GET /API/cfgItems/categories?filter=asset
```
response:
```
{
	"status":"ok", //ok, info, warning, error,
	"message":{
		"content":"message text here",
		"displayAs":"toast" //toast, modal, console, alert
	},
	"data":{
		"results":[ //当前页的所有成员的name, description, id
			{},
			{}
		]
	}
}
```

返回指定配置项的详细信息：
```
GET /API/cfgItems/{id}
```
## 搜
```
POST /API/cfgItems/search?page={page}&per_page={per_page}
```
request:
```
{
	"token": "xxxxxxxxxxxxxxxxxx",
	"conditions":{
		"tags":{
			"content": ["tag1","tag2"],
			"logic": "and"//and, or, not
		},
		"IT Services":{
			"content": ["service1","service2"],
			"logic": "and"//and, or, not
		},
		"keywords":{
			"content": ["keyword1","keyword2"],
			"logic": "and"//and, or, not
		},
		"logic": "and"//and, or, not
	}
}
```
## 增
```
POST /API/cfgItems/
```
request:
```
{
	"token": "xxxxxxxxxxxxxxxxxx",
	"data":{
	    "category":"category name", //PhysicalServer, VirtualServer, Firewall, Router, Switch, Storage, Camera
	    fields:{
    	    "field1":"field1 text",
            "field2":"field2 text"
	    }
	}
}
```
response:
成功：
```
{
    "status":"info", //ok, info, warning, error,
    "message":{
        "content":"添加成功",
        "displayAs":"toast" //toast, modal, console, alert
    }
}
```
失败：
```
{
    "status":"error", //ok, info, warning, error,
    "message":{
        "content":"添加失败：{原因}",
        "displayAs":"modal" //toast, modal, console, alert
    }
}
```
## 删
```
DELETE /API/cfgItems/{id}
```
## 改
```
PUT /API/cfgItems/{id} //必须包含所有字段
PATCH /API/cfgItems/{id} //部分或单个字段
```
# 身份认证：
读取MySQL中的tokens表，有记录即可通过；后期需增加根据用户id做权限判断
mysql_auth.sql位于项目文件中，包含users和tokens两张表，暂时只需用到tokens

# 建模

第一层父类，继承关系如下：

```
ConfigurationItem
	Asset
		Hardware
		Software
	AbstractServer//服务器
	Application//暂时忽略
```

字段定义：

```
ConfigurationItem字段
	Name//string, required
	IT Service//IT_Service, 为了不影响进度，初期为可选字段，待IT Service相关接口完善，此字段改为必填。从现有IT Service列表中选择，关系：(ConfigurationItem)-[:SUPPORT:]-> (IT Service)
	Monitored//bool, required, default: false
	Responsibility//User, 系统中的User对象，初期为可选字段，待User相关接口完善，此字段改为必填，关系：(User)-[:RESPONSIBLE FOR:]-> (ConfigurationItem)
	Technical Support Info//string, optional
	Date Added//date, 自动生成，虽然名字是date但请保存具体时间，时间戳格式
	Last Updated//date，自动生成，虽然名字是date但请保存具体时间，时间戳格式
	Updated By//User，自动生成，保存用户id
Asset字段
	Asset ID//待定，暂时为空
	SN//string, optional
	GEO Location//string, required
	Asset location//位置信息，上架或未上架。
		上架：//(Asset)-[:IS LOCATED:{status:'mounted',U:42,'Date Mounted':'time stamp'}]-> (Cabinet)
			Cabinet//string, required 
			U//int, required
			Date Mounted//date, required, 时间戳
		未上架：//(Asset)-[:IS LOCATED:{status:'unmounted'}]-> (Location)
			Position//string
	Model//string, required
	Product Date //date, required, 时间戳
	Warranty Expiration Date //date, required, 时间戳
	Date of Retirement //date, optional, 时间戳
AbstractServer字段：
	IP Address //array: valid IPv4 addresses, required
	Virtual Machine //bool, required
	Operating System //string, required
	Hardware Info //string, optional
	Storage Info //string, required if ("Virtual Machine"==true)
```


第二层 - category
```
PhysicalServer - 物理机：继承ConfigurationItem.AbstractServer, ConfigurationItem.Asset.Hardware
VirtualServer - 虚拟机：继承ConfigurationItem.AbstractServer
Storage - 存储：继承ConfigurationItem.Asset.Hardware
NetworkDevice - 网络设备：继承ConfigurationItem.Asset.Hardware
– Switch - 交换机 
– Router - 路由器 
– Firewall - 防火墙
Camera - 摄像头：继承ConfigurationItem.Asset.Hardware
```
字段定义：
```
PhysicalServer //物理机：
	Management IP //array: valid IPv4 addresses
VirtualServer //虚拟机：
	Host Server //PhysicalServer
```

其他类的字段：
```
Cabinet
    Name //string, required
    Description //string
Location
    Name //string, required
    Description //string
```

# 测试集用postman保存；

# 项目阶段：
- 配置项目增删改查、搜索、身份认证
-- Users查询、与配置项关联
-- Location, Cabinet增删改查、与配置项关联
-- 配置项签入、签出
- IT_Services增删改查、与配置项关联
- 变更记录的保存和查询、搜索
- 权限管理


# 补充：与配置项相关联的对象
## 用户
### 查、搜
> 搜索Users，将keyword作为条件匹配alias字段，若keyword为空则返回所有：//只返回公开信息：userid, alias, lang, name, surname；系统权限功能启用之后，针对admin用户，此API返回passwd之外的用户的所有字段
```
GET /API/users?keyword={keyword}&page={page}&per_page={per_page}
```
> 不加参数则直接返回所有用户列表：
```
GET /API/users/
```
```
{
	"status":"ok", //ok, info, warning, error,
	"message":{
		"content":"message text here",
		"displayAs":"toast" //toast, modal, console, alert
	},
	"data":{
		"results":[ //所有user的userid, alias, lang, name, surname
		]
	}
}
```

> 返回指定User的详细信息：//要求同上

```
GET /API/users/{id}
```

## Cabinet
### 查、搜
> 搜索Cabinets，将keyword作为条件匹配==所有==字段，若keyword为空则返回所有：
```
GET /API/cabinets?keyword={keyword}&page={page}&per_page={per_page}
```
> 返回指定Cabinet的详细信息：//要求同上

```
GET /API/cabinets/{id}
```

### 增删改：格式和cfgItems相同，略
以下格式和Cabinet相同，所以仅注明URI
## Location:  /API/locations
## IT Service:  /API/IT_Services
关系：

```(sg1:ITServiceGroup)<-[:BelongsTo]-(service1:ITService)-[:ParentOf]->(service2:ITService)-[:DependsOn]->(service3:ITService)```

字段定义：

    IT Service：
        ID //uuid
        Name //string, required
        Description //string
    IT Service Group:
        ID //uuid
        Name //string, required
        Description //string

全部服务列表查询：列出所有的分组和服务、子服务:

```/API/IT_Services```

```
{
	"status":"ok", //ok, info, warning, error,
	"message":{
		"content":"message text here",
		"displayAs":"toast" //toast, modal, console, alert
	},
	"data":{
		"results":[ //所有成员的ID, Name, Description: group->service->subservice
		]
	}
}
```

查看某IT Service, IT Service Group:

```
/API/IT_Services/service/{IT Service uuid}
/API/IT_Services/group/{IT Service Group uuid}
```

以下数组中的服务对象，只需包含Name, Description, uuid

```
{
	"status":"ok", //ok, info, warning, error,
	"message":{
		"content":"message text here",
		"displayAs":"toast" //toast, modal, console, alert
	},
	"data":{
		"Type":"IT Service(Group) uuid"
		"ID":"IT Service(Group) uuid",
		"Name":"IT Service(Group) Name",
		"Description":"IT Service Desc",
		"Services":[ITService1, ITService2], // n/a for IT Service
		"Group":"ITServiceGroup Name",// n/a for IT Service Group
		"Sub IT Services":[ITService1, ITService2],// n/a for IT Service Group
		"Parent":"IT Service Name",// n/a for IT Service Group
		"Dependencies":[],// n/a for IT Service Group
		"Dependendents":[] // n/a for IT Service Group
	}
}
```

# 安装部署
    
A [CMDB](https://en.wikipedia.org/wiki/Configuration_management_database) backend implementation built with [Neo4j](http://vertx.io/vertx2/), [ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/master/getting-started.html). 

## Relationship for Entities 

```
(:ITServiceGroup)<-[:BelongsTo]-(:ITService)
(:ITService)-[:ParentOf]->(:ITService)
(:ITService)-[:DependsOn]->(:ITService)
```

```
(:ConfigurationItem)-[:LOCATED]->(:Cabinet|Location)
(:ConfigurationItem)-[:SUPPORT_SERVICE]->(:ITService)
(:ConfigurationItem)<-[r:RESPONSIBLE_FOR]-(:User)
```

```
(:ProcessFlow)-[:CommitedBy|ExecutedBy]->(:User)
(:ProcessFlow)-[:REFERENCED_SERVICE]->(:ITService)
(:ProcessFlow)<-[:REFERENCED_PROCESSFLOW]-(:ProcessFlow)
```


## Build and Start

### Prepare User

Since user data is synchronized from mysql,so add some mock user here. 


    MERGE (u:User{userid:1}) ON CREATE SET u = {autologin:1,type:3,uuid:1,attempt_ip:"10.50.13.69",userid:1,surname:"werq",name:"test",alias:"nerds",lang:"en_GB"}


### DB Server

>	[neo4j](http://neo4j.com/docs/operations-manual/current/installation/)

>	[elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/master/_installation.html)

### Nbi Server
    
*install npm dependencies and compile codes and start nbi* 

    
    npm install
    npm run webpack
    npm start
    

*run test cases with [postman](https://www.getpostman.com/docs/)*

    npm run postman


