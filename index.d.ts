
export interface StoreType {
  name: string;//必填
  mainKey?: string; //主键(无主键就默认自增主键)
  autoIncrement?: boolean;//默认为true,主键是否自增
  index?: Array<string>;//仓库索引
}

export interface ConfigType {
  upgrade?: Boolean;
}

export interface ParamsType {
  sname?: string;
  [prop: string]: any | undefined;
}

export interface ResponseType {
  code: number;
  data?: { [prop: string]: any } | Array<any> | null;
  msg?: string;
}

export function createIndexedDB(dbname: string, stores: Array<StoreType>,initData:{[prop:string]:Array<any>}|undefined|null, config?: ConfigType): void;

export function deleteIndexedDB(dbname: string): void;

export namespace $db {
  function get(dbname: string, params: ParamsType): Promise<ResponseType>;
  function add(dbname: string, params: ParamsType): Promise<ResponseType>;
  function del(dbname: string, params: ParamsType): Promise<ResponseType>;
  function upd(dbname: string, params: ParamsType): Promise<ResponseType>;
}