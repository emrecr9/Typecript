import { Injectable } from "@nestjs/common";
import { Prisma, Shift, type Worker } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { getNextPage, queryParameters } from "../shared/pagination";
import { Filters, Page, PaginatedData } from "../shared/shared.types";
import { CreateWorker } from "./workers.schemas";
import { buildWhereFilter, getNextWeekLimits, getWeekLimits } from "../shared/shared.methods";
import { threeWeeksBonus, twoWeeksBonus } from "../shared/constants";

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateWorker): Promise<Worker> {
    return await this.prisma.worker.create({ data });
  }

  async getById(id: number): Promise<Worker | null> {
    return await this.prisma.worker.findUnique({ where: { id } });
  }

  async get(parameters: { page: Page }): Promise<PaginatedData<Worker>> {
    const { page } = parameters;
    const databaseQueryParameters = queryParameters({ page });

    const workers = await this.prisma.worker.findMany({
      ...databaseQueryParameters,
      orderBy: { id: "asc" },
    });

    const nextPage = await getNextPage({
      currentPage: page,
      collection: this.prisma.worker,
    });

    return { data: workers, nextPage };
  }

  async getClaims(parameters: { id: number; page: Page }): Promise<PaginatedData<Shift>> {
    const { page } = parameters;

    const { where, ...queryParams } = queryParameters({ page });

    const claims = await this.prisma.shift.findMany({
      ...queryParams,
      where: { ...where, workerId: parameters.id },
      orderBy: { id: "asc" },
    });

    const nextPage = await getNextPage({
      currentPage: page,
      collection: this.prisma.shift,
    });

    return { data: claims, nextPage };
  }

  async getBonusShifts(parameters: { id: number, page: Page, filters: Filters }): Promise<PaginatedData<Shift & { streakBonusPercent: number }>> {
    const { id, page, filters } = parameters;
    const currentDate = new Date();
    const { startDate, endDate } = getWeekLimits(currentDate);
    const { nextEndDate, nextStartDate} = getNextWeekLimits(currentDate);

    const userShifts = await this.prisma.shift.findMany({
      where: {
        workerId: id,
        startAt: {
          gte: startDate,
          lte: endDate
        },
        cancelledAt: null
      }
    })


    const bonusByWorkplaceId = this.buildBonusByWorkplaceId(userShifts);

    const eligibleWorkplaceIds = Array.from(bonusByWorkplaceId.entries())
      .filter(([, count]) => count >= 2)
      .map(([workplaceId]) => workplaceId);

    const nextShiftsWhereFilter = this.buildNextShiftsWhereFilter(
      filters,
      eligibleWorkplaceIds,
      nextStartDate,
      nextEndDate,
    );

    const nextWeekShifts = await this.prisma.shift.findMany({
      ...queryParameters({ page }),
      where: nextShiftsWhereFilter,
    });

    const shiftsWithBonus = nextWeekShifts.map((shift) => ({
      ...shift,
      streakBonusPercent: this.getStreakBonusPercent(bonusByWorkplaceId.get(shift.workplaceId) ?? 0),
    }));

    const nextPage = await getNextPage({
      currentPage: page,
      collection: this.prisma.shift,
      whereFilter: nextShiftsWhereFilter,
    });

    return { data: shiftsWithBonus, nextPage };
  }

  private buildBonusByWorkplaceId(shifts: Shift[]): Map<number, number> {
    const bonusByWorkplaceId = new Map<number, number>();
    for (const shift of shifts) {
      const count = bonusByWorkplaceId.get(shift.workplaceId) ?? 0;
      bonusByWorkplaceId.set(shift.workplaceId, count + 1);
    }
    return bonusByWorkplaceId;
  }

  private buildNextShiftsWhereFilter(
    filters: Filters,
    eligibleWorkplaceIds: number[],
    start: Date,
    end: Date,
  ): Prisma.ShiftWhereInput {
    return {
      ...buildWhereFilter({ ...filters, workerId: null }),
      workplaceId: { in: eligibleWorkplaceIds },
      startAt: { gte: start, lte: end },
    };
  }

  private getStreakBonusPercent(count: number): number {
    if (count >= 3) return threeWeeksBonus;
    if (count >= 2) return twoWeeksBonus;
    return 0;
  }
}


