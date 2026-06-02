import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

import { MAX_SHARDS } from "./constants";
import { Page } from "./shared.types";

interface CountableCollection {
  count(parameters: { skip: number; take: number; where: any }): Promise<number>;
}

const FIRST_PAGE = 1;
const PAGE_SIZE = 10;
const PAGE_QUERY_PARAM = "page";
const SHARD_QUERY_PARAM = "shard";
const DEFAULT_SHARD = 0;

function parseOptionalInt(value?: string): number | undefined {
  return value ? parseInt(value, 10) : undefined;
}

function urlWithoutQueryParameters(request: Request): string {
  const protocolAndHost = `${request.protocol}://${request.get("Host")}`;
  const pathname = new URL(`${protocolAndHost}${request.originalUrl}`).pathname;
  return `${protocolAndHost}${pathname}`;
}

export function getPage(pageNum?: number, shard?: number): Page {
  return { 
    num: pageNum ? pageNum : FIRST_PAGE, 
    size: PAGE_SIZE, 
    shard: shard !== undefined ? shard : DEFAULT_SHARD 
  };
}

export function nextLink(parameters: { nextPage?: Page; request: Request }): string | undefined {
  const { nextPage, request } = parameters;
  if (nextPage) {
    const url = new URL(`${request.protocol}://${request.get("Host")}${request.originalUrl}`);
    const searchParams = new URLSearchParams(url.search);

    // Update pagination parameters
    searchParams.set(PAGE_QUERY_PARAM, nextPage.num.toString());
    if (nextPage.shard !== undefined) {
      searchParams.set(SHARD_QUERY_PARAM, nextPage.shard.toString());
    }

    return `${urlWithoutQueryParameters(request)}?${searchParams.toString()}`;
  }
}

export function queryParameters(parameters: { page: Page; whereFilter?: any }): {
  skip: number;
  take: number;
  where: any;
} {
  const { page, whereFilter } = parameters;
  return {
    take: page.size,
    skip: page.num * page.size,
    where: {
      shard: page.shard ?? DEFAULT_SHARD,
      ...(whereFilter ? whereFilter : {}),
    },
  };
}

async function countOnPage(
  page: Page,
  collection: CountableCollection,
  whereFilter?: any,
): Promise<number> {
  return collection.count(queryParameters({ page, whereFilter }));
}

export async function getNextPage(parameters: {
  currentPage: Page;
  collection: CountableCollection;
  whereFilter?: any;
}): Promise<Page | undefined> {
  const { currentPage, collection, whereFilter } = parameters;
  const nextPageNum = currentPage.num + 1;
  const nextPageInShard = getPage(nextPageNum, currentPage.shard);

  const countRemainingInShard = await countOnPage(nextPageInShard, collection, whereFilter);

  if (countRemainingInShard > 0) {
    return nextPageInShard;
  }

  const nextShard = (currentPage.shard ?? DEFAULT_SHARD) + 1;

  if (nextShard > MAX_SHARDS) {
    return undefined;
  }

  const pageInNextShard = getPage(FIRST_PAGE, nextShard);

  const countInNextShard = await countOnPage(pageInNextShard, collection, whereFilter);

  if (countInNextShard > 0) {
    return pageInNextShard;
  }

  return undefined;
}

export function omitShard<T extends { shard: number }>(obj: T): Omit<T, "shard"> {
  const { shard: _, ...rest } = obj;
  return rest;
}

// NestJS Decorator
export const PaginationPage = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const page = parseOptionalInt(request.query[PAGE_QUERY_PARAM]);
  const shard = parseOptionalInt(request.query[SHARD_QUERY_PARAM]);

  return getPage(page, shard);
});
