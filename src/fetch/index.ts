import { deleteKeys, objectToUrlParams } from "../utils/types";

function request(url: string, options: RequestInit) {
  return fetch(url, options);
}

const exports: Record<string, Function> = {};

function parseUrl(url: string, data: any, p: boolean): string {
  return p ? `${url}?${objectToUrlParams(data)}` : url;
}


["get", "post", "patch", "put", "delete", "head"].forEach((key: string) => {
  exports[key] = (url: string, data: any, options: RequestInit) => {
    options = options ?? {};
    deleteKeys(options, ["url", "method"]);
    const some = ["get", "head"].some(k => k === key);
    if (some) deleteKeys(options, ["url", "method", "data", "body"]);
    else {
      options["body"] = data;
    }
    return request(parseUrl(url, data, ["get", "head"].some(k => k === key)), Object.assign({
      method: key
    }, options));
  };
});

export default exports;