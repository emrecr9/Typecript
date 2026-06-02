import { Worker } from "@prisma/client";
import { z } from "zod";

import { Serialized } from "../shared/shared.types";

export const enum WorkerStatus {
  ACTIVE = 0,
  SUSPENDED = 1,
  CLOSED = 2,
}

export const createWorkerSchema = z.object({
  name: z.string(),
});

export type CreateWorker = z.infer<typeof createWorkerSchema>;

export type WorkerDTO = Serialized<Omit<Worker, "shard">>;

export const bonusShiftsQuerySchema = z.object({
  jobType: z.string().optional(),
  location: z.string().optional(),
});

export type BonusShiftsQuery = z.infer<typeof bonusShiftsQuerySchema>;

