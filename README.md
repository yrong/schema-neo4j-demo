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
-- 配置项签入、签出
- IT_Services增删改查、与配置项关联
- 变更记录的保存和查询、搜索
- 权限管理


