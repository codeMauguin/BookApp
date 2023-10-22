import { isNull, merge, notNull } from "../utils/types";

interface HeaderRaw {

  get(key: string): undefined | string | string[];

  set(key: string, value: string | string[]): void;

  delete(key: string, value?: string): void;

  toJson(): object;

  toString(): object;
}

class HeaderRawDefault implements HeaderRaw {
  private headers: Record<string, string | string[]> = {};

  constructor(headers: undefined | object) {
    if (notNull(headers)) {
      merge(this.headers, headers, true);
    }
  }

  get(key: string): undefined | string | string[] {
    return Reflect.get(this.headers, key);
  }

  set(key: string, value: string | string[]): void {
    const oldVar = this.get(key);
    if (isNull(oldVar)) Reflect.set(this.headers, key, value);
    else if (Array.isArray(oldVar)) {
      if (Array.isArray(value)) {
        oldVar.push(...value);
      } else {
        oldVar.push(value);
      }
      Reflect.set(this.headers, key, oldVar);
    } else {
      Reflect.set(this.headers, key, [oldVar, value]);
    }
  }

  delete(key: string, value?: string | undefined): void {
    if (isNull(value)) {
      Reflect.deleteProperty(this.headers, key);
    } else {
      const oldVal = this.get(key);
      const isString = typeof oldVal === "string";
      if (isNull(oldVal) || (isString && oldVal !== value)) return;
      if (isString) Reflect.deleteProperty(this.headers, key);
      else {
        const from: string[] = Array.from(<string[]>oldVal);
        from.splice(from.indexOf(<string>value), 1);
        Reflect.set(this.headers, key, from);
      }
    }
  }

  toJson(): object {
    return this.headers;
  }

  toString(): object {
    return this.headers;
  }
}

export default function(headers: undefined | object): HeaderRaw {
  return new HeaderRawDefault(headers);
}