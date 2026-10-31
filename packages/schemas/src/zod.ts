/**
 * Lightweight, zero-dependency, self-contained Zod-compatible validator.
 * Compatible with Node 24 experimental-strip-types (no parameter properties).
 */

export interface Issue {
  path: string[];
  message: string;
}

export interface ParseSuccess<T> {
  success: true;
  data: T;
}

export interface ParseError {
  success: false;
  issues: Issue[];
  error: {
    message: string;
    errors: Issue[];
  };
}

export type SafeParseResult<T> = ParseSuccess<T> | ParseError;

export abstract class ZodType<T = any> {
  _type!: T;

  abstract safeParse(data: unknown, path?: string[]): SafeParseResult<T>;

  parse(data: unknown): T {
    const result = this.safeParse(data);
    if (result.success) {
      return result.data;
    }
    const formatted = result.issues.map((i) => `  - [${i.path.join('.')}]: ${i.message}`).join('\n');
    throw new Error(`Validation Error:\n${formatted}`);
  }

  optional(): ZodOptional<this> {
    return new ZodOptional(this);
  }
}

export type TypeOf<T extends ZodType<any>> = T['_type'];
export type zInfer<T extends ZodType<any>> = T['_type'];

export class ZodString extends ZodType<string> {
  private _min?: number;
  private _max?: number;
  private _regex?: RegExp;

  min(length: number, message?: string): this {
    this._min = length;
    return this;
  }

  max(length: number, message?: string): this {
    this._max = length;
    return this;
  }

  regex(pattern: RegExp, message?: string): this {
    this._regex = pattern;
    return this;
  }

  safeParse(data: unknown, path: string[] = []): SafeParseResult<string> {
    if (typeof data !== 'string') {
      const msg = `Expected string, received ${typeof data}`;
      return {
        success: false,
        issues: [{ path, message: msg }],
        error: { message: msg, errors: [{ path, message: msg }] },
      };
    }
    if (this._min !== undefined && data.length < this._min) {
      const msg = `String must contain at least ${this._min} character(s)`;
      return { success: false, issues: [{ path, message: msg }], error: { message: msg, errors: [{ path, message: msg }] } };
    }
    if (this._max !== undefined && data.length > this._max) {
      const msg = `String must contain at most ${this._max} character(s)`;
      return { success: false, issues: [{ path, message: msg }], error: { message: msg, errors: [{ path, message: msg }] } };
    }
    if (this._regex && !this._regex.test(data)) {
      const msg = `String does not match required format`;
      return { success: false, issues: [{ path, message: msg }], error: { message: msg, errors: [{ path, message: msg }] } };
    }
    return { success: true, data };
  }
}

export class ZodNumber extends ZodType<number> {
  private _min?: number;
  private _max?: number;

  min(val: number): this {
    this._min = val;
    return this;
  }

  max(val: number): this {
    this._max = val;
    return this;
  }

  safeParse(data: unknown, path: string[] = []): SafeParseResult<number> {
    if (typeof data !== 'number' || Number.isNaN(data)) {
      const msg = `Expected number, received ${typeof data}`;
      return {
        success: false,
        issues: [{ path, message: msg }],
        error: { message: msg, errors: [{ path, message: msg }] },
      };
    }
    if (this._min !== undefined && data < this._min) {
      const msg = `Number must be greater than or equal to ${this._min}`;
      return { success: false, issues: [{ path, message: msg }], error: { message: msg, errors: [{ path, message: msg }] } };
    }
    if (this._max !== undefined && data > this._max) {
      const msg = `Number must be less than or equal to ${this._max}`;
      return { success: false, issues: [{ path, message: msg }], error: { message: msg, errors: [{ path, message: msg }] } };
    }
    return { success: true, data };
  }
}

export class ZodBoolean extends ZodType<boolean> {
  safeParse(data: unknown, path: string[] = []): SafeParseResult<boolean> {
    if (typeof data !== 'boolean') {
      const msg = `Expected boolean, received ${typeof data}`;
      return {
        success: false,
        issues: [{ path, message: msg }],
        error: { message: msg, errors: [{ path, message: msg }] },
      };
    }
    return { success: true, data };
  }
}

export class ZodEnum<U extends readonly [string, ...string[]]> extends ZodType<U[number]> {
  options: U;

  constructor(options: U) {
    super();
    this.options = options;
  }

  safeParse(data: unknown, path: string[] = []): SafeParseResult<U[number]> {
    if (typeof data !== 'string' || !this.options.includes(data as any)) {
      const msg = `Expected one of [${this.options.join(', ')}], received ${JSON.stringify(data)}`;
      return {
        success: false,
        issues: [{ path, message: msg }],
        error: { message: msg, errors: [{ path, message: msg }] },
      };
    }
    return { success: true, data: data as U[number] };
  }
}

export class ZodArray<T extends ZodType<any>> extends ZodType<Array<TypeOf<T>>> {
  private _min?: number;
  element: T;

  constructor(element: T) {
    super();
    this.element = element;
  }

  min(val: number): this {
    this._min = val;
    return this;
  }

  safeParse(data: unknown, path: string[] = []): SafeParseResult<Array<TypeOf<T>>> {
    if (!Array.isArray(data)) {
      const msg = `Expected array, received ${typeof data}`;
      return {
        success: false,
        issues: [{ path, message: msg }],
        error: { message: msg, errors: [{ path, message: msg }] },
      };
    }
    if (this._min !== undefined && data.length < this._min) {
      const msg = `Array must contain at least ${this._min} element(s)`;
      return { success: false, issues: [{ path, message: msg }], error: { message: msg, errors: [{ path, message: msg }] } };
    }
    const output: Array<TypeOf<T>> = [];
    const issues: Issue[] = [];
    for (let i = 0; i < data.length; i++) {
      const res = this.element.safeParse(data[i], [...path, String(i)]);
      if (!res.success) {
        issues.push(...res.issues);
      } else {
        output.push(res.data);
      }
    }
    if (issues.length > 0) {
      return { success: false, issues, error: { message: issues[0].message, errors: issues } };
    }
    return { success: true, data: output };
  }
}

export class ZodObject<T extends Record<string, ZodType<any>>> extends ZodType<{ [K in keyof T]: TypeOf<T[K]> }> {
  shape: T;

  constructor(shape: T) {
    super();
    this.shape = shape;
  }

  extend<E extends Record<string, ZodType<any>>>(extension: E): ZodObject<T & E> {
    return new ZodObject({ ...this.shape, ...extension } as T & E);
  }

  safeParse(data: unknown, path: string[] = []): SafeParseResult<{ [K in keyof T]: TypeOf<T[K]> }> {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      const msg = `Expected object, received ${typeof data}`;
      return {
        success: false,
        issues: [{ path, message: msg }],
        error: { message: msg, errors: [{ path, message: msg }] },
      };
    }
    const obj = data as Record<string, unknown>;
    const output: any = {};
    const issues: Issue[] = [];

    for (const key of Object.keys(this.shape)) {
      const fieldValidator = this.shape[key];
      const val = obj[key];
      const fieldPath = [...path, key];

      const res = fieldValidator.safeParse(val, fieldPath);
      if (!res.success) {
        issues.push(...res.issues);
      } else if (res.data !== undefined) {
        output[key] = res.data;
      }
    }

    if (issues.length > 0) {
      return { success: false, issues, error: { message: issues[0].message, errors: issues } };
    }
    return { success: true, data: output };
  }
}

export class ZodOptional<T extends ZodType<any>> extends ZodType<TypeOf<T> | undefined> {
  inner: T;

  constructor(inner: T) {
    super();
    this.inner = inner;
  }

  safeParse(data: unknown, path: string[] = []): SafeParseResult<TypeOf<T> | undefined> {
    if (data === undefined) {
      return { success: true, data: undefined };
    }
    return this.inner.safeParse(data, path);
  }
}

export class ZodRecord<V extends ZodType<any>> extends ZodType<Record<string, TypeOf<V>>> {
  valueType: V;

  constructor(valueType: V) {
    super();
    this.valueType = valueType;
  }

  safeParse(data: unknown, path: string[] = []): SafeParseResult<Record<string, TypeOf<V>>> {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      const msg = `Expected record object, received ${typeof data}`;
      return {
        success: false,
        issues: [{ path, message: msg }],
        error: { message: msg, errors: [{ path, message: msg }] },
      };
    }
    const obj = data as Record<string, unknown>;
    const output: Record<string, TypeOf<V>> = {};
    const issues: Issue[] = [];

    for (const key of Object.keys(obj)) {
      const res = this.valueType.safeParse(obj[key], [...path, key]);
      if (!res.success) {
        issues.push(...res.issues);
      } else {
        output[key] = res.data;
      }
    }
    if (issues.length > 0) {
      return { success: false, issues, error: { message: issues[0].message, errors: issues } };
    }
    return { success: true, data: output };
  }
}

export class ZodUnion<T extends readonly [ZodType<any>, ...ZodType<any>[]]> extends ZodType<TypeOf<T[number]>> {
  options: T;

  constructor(options: T) {
    super();
    this.options = options;
  }

  safeParse(data: unknown, path: string[] = []): SafeParseResult<TypeOf<T[number]>> {
    const allIssues: Issue[] = [];
    for (const opt of this.options) {
      const res = opt.safeParse(data, path);
      if (res.success) {
        return res;
      }
      allIssues.push(...res.issues);
    }
    const msg = `Did not match any union variant`;
    return {
      success: false,
      issues: [{ path, message: msg }],
      error: { message: msg, errors: [{ path, message: msg }] },
    };
  }
}

export class ZodLiteral<T extends string | number | boolean> extends ZodType<T> {
  value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  safeParse(data: unknown, path: string[] = []): SafeParseResult<T> {
    if (data !== this.value) {
      const msg = `Expected literal ${JSON.stringify(this.value)}, received ${JSON.stringify(data)}`;
      return {
        success: false,
        issues: [{ path, message: msg }],
        error: { message: msg, errors: [{ path, message: msg }] },
      };
    }
    return { success: true, data: this.value };
  }
}

export class ZodAny extends ZodType<any> {
  safeParse(data: unknown): SafeParseResult<any> {
    return { success: true, data };
  }
}

export const z = {
  string: () => new ZodString(),
  number: () => new ZodNumber(),
  boolean: () => new ZodBoolean(),
  enum: <U extends readonly [string, ...string[]]>(values: U) => new ZodEnum(values),
  array: <T extends ZodType<any>>(type: T) => new ZodArray(type),
  object: <T extends Record<string, ZodType<any>>>(shape: T) => new ZodObject(shape),
  record: <V extends ZodType<any>>(valueType: V) => new ZodRecord(valueType),
  union: <T extends readonly [ZodType<any>, ...ZodType<any>[]]>(options: T) => new ZodUnion(options),
  literal: <T extends string | number | boolean>(val: T) => new ZodLiteral(val),
  any: () => new ZodAny(),
};
