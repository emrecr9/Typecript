import type { Worker } from "@prisma/client";

import { omitShard } from "../shared/pagination";
import type { WorkerDTO } from "./workers.schemas";

export function toWorkerDTO(worker: Worker): WorkerDTO {
  return omitShard(worker);
}
