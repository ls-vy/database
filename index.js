const $CODE = {
  ERROR: 10,// 错误
  SUCCESS: 20,// 成功
  FAIL: 40,// 失败
}
const $RES = {
  paramsError: {
    code: $CODE.ERROR,
    msg: "参数错误！",
  },
  connectFail: {
    code: $CODE.FAIL,
    msg: "连接失败！",
  }
}
const $DATA = {
  versionNumber: 1,//indexedDB版本数字
  storesMap: new Map(),
}
const $FN = {
  getDB: (dbname, config) => {
    let { upgrade } = config || {};
    if (!dbname || typeof dbname !== "string") { return false; }
    return new Promise((rs, rj) => {
      if (upgrade) $DATA.versionNumber++;
      let req = window.indexedDB.open(dbname, $DATA.versionNumber);
      req.onupgradeneeded = (event) => { //第一次打开或版本升级
        console.log(`创建/升级数据库：${dbname}，版本：${$DATA.versionNumber}`);
        rs(event.target.result);
      }
      req.onsuccess = () => {
        console.log(`打开数据库：${dbname}，版本：${$DATA.versionNumber}`);
        $DATA.versionNumber = req.result.version;
        rs(req.result);
      }
      req.onerror = (err) => {
        console.log(`打开数据库失败：`, err);
        rj({ code: $CODE.ERROR, msg: "打开数据库失败！" });
      }
    });
  },
  // 通过筛选条件（filter）过滤数据（list）
  filters: (list, filter, logic) => {
    console.log("strat filter!", list, filter, logic);
    let keys = Object.keys(filter);
    let res = [];

    let dealKey = (data, key) => {
      return data[key];
    }

    if (logic === "and" || logic === "&&") {
      for (let data of list) {
        let pass = 0; //当前数据是否满足筛选
        for (let i = 0, len = keys.length; i < len; i++) {
          if (dealKey(data, keys[i]) !== filter[keys[i]]) {
            pass = 0;
            break;
          }
          pass++;
        }
        if (pass) {
          res.push(data);
        }
      }
    } else {
      for (let data of list) {
        let pass = 0; //当前数据是否满足筛选
        for (let i = 0, len = keys.length; i < len; i++) {
          if (dealKey(data, keys[i]) === filter[keys[i]]) {
            pass = 1;
            break;
          }
        }
        if (pass) {
          res.push(data);
        }
      }
    }
    // console.log("finish filter!",res);
    return res;
  },
  // 获取仓库（表）的索引
  getIndex: (sname) => {
    return ($DATA.storesMap.get(sname) || {}).index || [];
  },
  // 获取仓库（表）的主键
  getMainkey: (sname) => {
    return ($DATA.storesMap.get(sname) || {}).mainKey || "";
  },
}

// 创建数据库
export function createIndexedDB(dbname, stores, config) {
  /*
    dbname: string,
    stores: array<item>，
      item:{
        name: string,
        mainKey: string, //主键(无主键就默认自增主键)
        index: array<string>,
      }
    config: {
      upgrade: boolean,//是否升级版本，true:版本++
    }
   */

  $FN.getDB(dbname, config).then(db => {
    if (db.code === 30) { return; }
    for (let prop of stores||[]) {
      $DATA.storesMap.set(prop.name,prop);
      if (!db.objectStoreNames.contains(prop.name)) {
        // 创建表
        let addparam = {
          autoIncrement: prop.autoIncrement === false ? false : true,
        };
        if (prop.mainKey) addparam.keyPath = prop.mainKey;
        let store = db.createObjectStore(prop.name, addparam);
        // 添加索引
        for (let key of prop.index || []) {
          store.createIndex(key, key, {
            unique: false
          });
        }
        console.log("创建了表：", prop.name);
      }
    }
  })
}
// 删除数据库
export function deleteIndexedDB(dbname) {
  if (!dbname || typeof dbname !== "string") { return false; }
  console.log("delete:", dbname);
  window.indexedDB.deleteDatabase(dbname);
}

export const $db = {
  get(dbname, {
    sname = "",
    filter = {},
    config = {},
  }) {
    /**
     * @param {Object}
     * sname: String,//表(仓库)名
     * filter: Object,//筛选条件，主键、索引、普通项
      * {
      *   [prop:string]:any,
      * }
     * config: object,//数据配置
      * {
      *   isDetail: false,//是否是获取详情，若是，则返回{}||null,否则返回[]，仅在主键查询且逻辑为“add||&&”时生效
      *   logic: ['and(&&)'||'or(||)'],//默认为“and”，filter条件是与还是或
      * }
     */
    let keys = Object.keys(filter);
    let isDetail = !!config?.isDetail;
    let logic = config?.logic || "and";
    //当前筛选的主键
    let mainkey = (() => {
      let mk = $FN.getMainkey(sname);
      return keys.includes(mk) ? mk : "";
    })();
    //当前筛选的所有索引
    let indexs = (() => {
      let res = [];
      for (let key of keys) {
        if ($FN.getIndex(sname).includes(key)) {
          res.push(key);
        }
      }
      return res;
    })();

    // filter type,筛选条件类型
    let ft = (() => {
      /**
       * 1:主键查询=>返回
       * 2:主键查询=>筛选=>返回
       * 3:索引查询=>返回
       * 4:索引查询=>筛选=>返回
       * 5:查询全部=>返回
       * 6:查询全部=>筛选=>返回
       */
      let kl = keys.length;
      //条件为“或”则查询所有后再筛选
      if (logic === "or" || logic === "||") return 6;
      if (mainkey) {
        return kl === 1 ? 1 : 2;
      } else if (indexs.length > 0) {
        return kl === 1 ? 3 : 4;
      } else {
        return keys.length === 0 ? 5 : 6;
      }
    })();
    // console.log("ft:",ft);
    return new Promise((resolve, reject) => {
      if (!sname) {
        reject($RES.paramsError);
        return;
      }
      $FN.getDB(dbname).then(async db => {
        if (db.code === 40) {
          reject({ code: $CODE.FAIL });
          return;
        }
        let store = db.transaction([sname]).objectStore(sname);
        let req, res = [];

        if (ft === 1 || ft === 2) { //主键查询
          req = store.get(filter[mainkey]);
          req.onsuccess = () => {
            // let result = isDetail?req.result:req.result?[req.result]:[];
            if (!req.result) {
              res = isDetail ? null : [];
            } else if (ft === 2) {
              let data = $FN.filters([req.result], filter, logic);
              res = isDetail ? data[0] || null : data;
            } else {
              res = isDetail ? req.result : [req.result];
            }
            resolve({
              code: $CODE.SUCCESS,
              data: res
            });
          }
        } else if (ft === 3 || ft === 4) { //索引查询
          req = store.index(indexs[0]).openCursor(IDBKeyRange.only(filter[indexs[0]]));
          req.onsuccess = () => {
            let cursor = req.result;
            if (cursor) { //如果存在
              res.push(cursor.value)
              cursor.continue(); //继续下一个
            } else {
              if (ft === 4) {
                res = $FN.filters(res, filter, logic);
              }
              resolve({
                code: $CODE.SUCCESS,
                data: res
              });
            }
          };
        } else { //普通查询
          req = store.getAll();
          req.onsuccess = () => {
            if (ft === 6) {
              res = $FN.filters(req.result, filter, logic);
            } else {
              res = req.result;
            }
            resolve({
              code: $CODE.SUCCESS,
              data: res
            });
          }
        }

        req.onerror = () => {
          reject({
            code:$CODE.FAIL,
            msg: "查询失败！"
          });
        }
      });
    }).catch(err => {
      throw err;
    });
  },
  add(dbname, {
    sname = "",
    dataType = "auto",//single,multiple,auto
    data,
  }) {
    return new Promise((resolve, reject) => {
      if (!sname) {
        reject($RES.paramsError);
        return;
      }
      $FN.getDB(dbname).then(db => {
        if (db.code === 40) {
          reject($RES.connectFail);
          return;
        }
        if(dataType==="auto"){
          dataType = Array.isArray(data)?"multiple":"single";
        }
        console.log("dataType:",dataType,data);
        if(dataType==="single"){
          let req = db.transaction([sname], 'readwrite').objectStore(sname).add(data);
          req.onsuccess = () => {
            resolve({
              code: $CODE.SUCCESS,
              data: req.result
            });
          };
          req.onerror = (err) => {
            reject({
              code: $CODE.FAIL,
              msg: "新增失败！"
            });
          }
        }else{
          let req = db.transaction([sname], 'readwrite').objectStore(sname);
          for(let prop of data||[]){
            req.add(prop);
          }
          req.onsuccess = () => {
            resolve({
              code: $CODE.SUCCESS,
              data: req.result
            });
          };
          req.onerror = (err) => {
            reject({
              code: $CODE.FAIL,
              msg: "新增失败！"
            });
          }
        }
      });
    }).catch(err => {
      throw err;
    });
  },
  del(dbname, {
    sname = "",
    key
  }) {
    return new Promise((resolve, reject) => {
      if (!key || !sname) {
        reject($RES.paramsError);
        return;
      }
      $FN.getDB(dbname).then(db => {
        if (db.code === 40) {
          reject($RES.connectFail);
          return;
        }
        let req = db.transaction([sname], 'readwrite').objectStore(sname).delete(key);
        req.onsuccess = () => {
          resolve({
            code: 10,
            data: req.result
          });
        };
        req.onerror = (err) => {
          reject({
            code: 20,
            data: "删除失败！"
          });
        }
      });
    }).catch(err => {
      throw err;
    });
  },
  upd(dbname, {
    sname = "",
    data
  }) {
    return new Promise((resolve, reject) => {
      if (!sname) {
        reject($RES.paramsError);
        return;
      }
      $FN.getDB(dbname).then(db => {
        if (db.code === 40) {
          reject($RES.connectFail);
          return;
        }
        let req = db.transaction([sname], 'readwrite').objectStore(sname).put(data);
        req.onsuccess = () => {
          resolve({
            code: $CODE.SUCCESS,
            data: req.result
          });
        };
        req.onerror = (err) => {
          reject({
            code: $CODE.FAIL,
            msg: "修改失败！"
          });
        }
      });
    }).catch(err => {
      throw err;
    });
  }
}
