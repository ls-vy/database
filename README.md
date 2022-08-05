# database
我的database测试项目，提供了indexedDB数据库的部分基础功能，包括：
1. 创建DB数据库；
2. 删除数据库；
3. 数据库数据的增删改查；

# API
## 1.创建数据库
`createIndexedDB`

``` js
// 例子
import {createIndexedDB} from "lgcc-database";
const stores = [{
  name: "storeName",
  mainKey: "id", //主键(无主键就默认自增主键)
  index: ["name", "group"], //索引
}]
createIndexedDB("databaseName",stores)
```

## 2.删除数据库
`deleteIndexedDB`

``` js
// 例子
import {deleteIndexedDB} from "lgcc-database";
deleteIndexedDB("databaseName")
```

## 3.操作数据
``` js
// 例子
import {$db} from "lgcc-database";
/*
$db:{
  get:()=>{},
  add:()=>{},
  del:()=>{},
  upd:()=>{},
}
*/
$db.get("databaseName",{
  sname: "storeName",
})
$db.add("databaseName",{
  sname: "storeName",
  data: {/*...*/},
})
$db.del("databaseName",{
  sname: "storeName",
  key: 1,//id
})

// IDBObjectStore.put()会根据data中的mainKey进行数据替换（即修改）
$db.upd("databaseName",{
  sname: "storeName",
  data: {/*...*/},
})
```

