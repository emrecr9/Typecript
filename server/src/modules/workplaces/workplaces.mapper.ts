import type { Workplace } from "@prisma/client";

import { omitShard } from "../shared/pagination";
import type { WorkplaceDTO } from "./workplaces.schemas";

export function toWorkplaceDTO(workplace: Workplace): WorkplaceDTO {
  return omitShard(workplace);
}
