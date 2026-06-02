/**
 * Recursively converts all Date types to strings in a type.
 * Use this for DTOs to reflect JSON serialization behavior.
 */
export type Serialized<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

export interface Response<T> {
  data: T;
}

export interface Page {
  num: number;
  size: number;
  shard?: number;
}

export interface PaginatedData<T> {
  data: T[];
  nextPage?: Page;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: { next?: string };
}

export interface Filters {
  jobType?: string;
  workerId?: number | null;
  location?: string;
}
