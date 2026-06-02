import { Shift } from "@prisma/client";
import { z } from "zod";

import { MAX_SHARDS } from "../shared/constants";
import { Serialized } from "../shared/shared.types";

export const createShiftSchema = z.object({
  startAt: z.string(),
  endAt: z.string(),
  workerId: z.string().optional(),
  workplaceId: z.number(),
  jobType: z.string(),
  shard: z.number().int().min(0).max(MAX_SHARDS).optional(),
});

export type CreateShift = z.infer<typeof createShiftSchema>;

export const getShiftsQuerySchema = z.object({
  workerId: z
    .union([
      z.literal("null").transform(() => null),
      z.literal("").transform(() => undefined),
      z.coerce.number().int().positive(),
    ])
    .optional(),
  jobType: z.string().optional(),
  location: z.string().optional(),
  page: z.coerce.number().int().nonnegative().optional(),
  shard: z.coerce.number().int().min(0).max(MAX_SHARDS).optional(),
});

export type GetShiftsQuery = z.infer<typeof getShiftsQuerySchema>;

export type ShiftDTO = Serialized<Omit<Shift, "shard">>;

export type BonusShiftDTO = ShiftDTO & { streakBonusPercent: number };
