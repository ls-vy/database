interface Store {
  name: string;
  mainKey?: string;
  index: Array<string>;
}
interface Config {
  upgrade?: Boolean;
}
interface ParamsType {
  sname?: string;
  [prop: string]: any | undefined;
}
interface RequestBack {
  code: number;
  data: { [prop: string]: any } | Array<any> | string | null;
}

declare function createIndexedDB(dbname: string, stores: Array<Store>, config: Config): void;

declare function deleteIndexedDB(dbname: string): void;

declare namespace $db {
  function get(dbname: string, params: ParamsType): Promise<RequestBack>;
  function add(dbname: string, params: ParamsType): Promise<RequestBack>;
  function del(dbname: string, params: ParamsType): Promise<RequestBack>;
  function upd(dbname: string, params: ParamsType): Promise<RequestBack>;
}