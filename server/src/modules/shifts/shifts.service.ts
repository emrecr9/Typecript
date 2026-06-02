import { Injectable } from "@nestjs/common";
import { Prisma, type Shift } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { getNextPage, queryParameters } from "../shared/pagination";
import { Filters, Page, PaginatedData } from "../shared/shared.types";
import { CreateShift } from "./shifts.schemas";
import { buildWhereFilter } from "../shared/shared.methods";

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateShift): Promise<Shift> {
    return await this.prisma.shift.create({
      data: data as Prisma.ShiftUncheckedCreateInput,
    });
  }

  async getById(id: number): Promise<Shift | null> {
    return await this.prisma.shift.findUnique({ where: { id } });
  }

  async get(parameters: { page: Page; filters: Filters }): Promise<PaginatedData<Shift>> {
    const { page, filters } = parameters;

    const whereFilter = buildWhereFilter(filters);
    const databaseQueryParameters = queryParameters({ page, whereFilter });

    const shifts = await this.prisma.shift.findMany({
      ...databaseQueryParameters,
      orderBy: { id: "asc" },
    });

    const nextPage = await getNextPage({
      currentPage: page,
      collection: this.prisma.shift,
      whereFilter,
    });

    return { data: shifts, nextPage };
  }

  async claim(id: number, workerId: number): Promise<Shift> {
    return await this.prisma.shift.update({
      where: {
        id,
        workerId: null,
      },
      data: { workerId, cancelledAt: null },
    });
  }

  async cancel(id: number): Promise<Shift> {
    return await this.prisma.shift.update({
      where: {
        id,
        workerId: { not: null },
      },
      data: {
        cancelledAt: new Date(),
        workerId: null,
      },
    });
  }
}
