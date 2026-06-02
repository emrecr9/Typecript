import { Workplace } from "@prisma/client";
import { z } from "zod";

import { MAX_SHARDS } from "../shared/constants";
import { Serialized } from "../shared/shared.types";

export const enum WorkplaceStatus {
  ACTIVE = 0,
  SUSPENDED = 1,
  CLOSED = 2,
}

export const createWorkplaceSchema = z.object({
  name: z.string(),
  location: z.string(),
  shard: z.number().int().min(0).max(MAX_SHARDS).optional(),
});

export type CreateWorkplace = z.infer<typeof createWorkplaceSchema>;

export type WorkplaceDTO = Serialized<Omit<Workplace, "shard">>;
