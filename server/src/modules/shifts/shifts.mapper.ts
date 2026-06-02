import type { Shift } from "@prisma/client";

import { omitShard } from "../shared/pagination";
import type { BonusShiftDTO, ShiftDTO } from "./shifts.schemas";

export function toShiftDTO(shift: Shift): ShiftDTO {
  const { createdAt, startAt, endAt, cancelledAt, ...rest } = omitShard(shift);
  return {
    ...rest,
    createdAt: createdAt.toISOString(),
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    cancelledAt: cancelledAt?.toISOString() ?? null,
  };
}

export function toBonusShiftDTO(bonusShift: Shift & { streakBonusPercent: number } ): BonusShiftDTO {
const { streakBonusPercent, ...shift } = bonusShift;
  return {
    ...toShiftDTO(shift),
    streakBonusPercent
  };
}
