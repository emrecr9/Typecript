import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UsePipes,
} from "@nestjs/common";
import { Request } from "express";

import { ZodValidationPipe } from "../../pipes/zod-validation-pipe";
import { nextLink, PaginationPage } from "../shared/pagination";
import { type Page, PaginatedResponse, type Response } from "../shared/shared.types";
import { toBonusShiftDTO, toShiftDTO } from "../shifts/shifts.mapper";
import { BonusShiftDTO, ShiftDTO } from "../shifts/shifts.schemas";
import { toWorkerDTO } from "./workers.mapper";
import {
  type BonusShiftsQuery,
  bonusShiftsQuerySchema,
  type CreateWorker,
  createWorkerSchema,
  WorkerDTO,
} from "./workers.schemas";
import { WorkersService } from "./workers.service";

@Controller("workers")
export class WorkersController {
  constructor(private readonly service: WorkersService) {}

  /**
   * Creates a new worker
   * @param data - The worker data to create
   * @returns The created worker
   */
  @Post()
  @UsePipes(new ZodValidationPipe(createWorkerSchema))
  async create(@Body() data: CreateWorker): Promise<Response<WorkerDTO>> {
    return { data: toWorkerDTO(await this.service.create(data)) };
  }

  /**
   * Retrieves paginated list of shifts claimed by a worker
   * @param request - The HTTP request object
   * @param id - The worker ID
   * @param page - Pagination parameters
   * @returns Paginated list of claimed shifts
   */
  @Get("/claims")
  async getClaims(
    @Req() request: Request,
    @Query("workerId", ParseIntPipe) id: number,
    @PaginationPage() page: Page,
  ): Promise<PaginatedResponse<ShiftDTO>> {
    const { data, nextPage } = await this.service.getClaims({ id, page });

    return {
      data: data.map(toShiftDTO),
      links: { next: nextLink({ nextPage, request }) },
    };
  }

  /**
   * Retrieves a worker by their ID
   * @param id - The worker ID
   * @returns The worker data
   * @throws Error when worker is not found
   */
  @Get("/:id")
  async getById(@Param("id", ParseIntPipe) id: number): Promise<Response<WorkerDTO>> {
    const data = await this.service.getById(id);
    if (!data) {
      throw new Error(`ID ${id} not found.`);
    }

    return { data: toWorkerDTO(data) };
  }

  /**
   * Retrieves a paginated list of workers
   * @param request - The HTTP request object
   * @param page - Pagination parameters
   * @returns Paginated list of workers
   */
  @Get()
  async get(
    @Req() request: Request,
    @PaginationPage() page: Page,
  ): Promise<PaginatedResponse<WorkerDTO>> {
    const { data, nextPage } = await this.service.get({ page });

    return {
      data: data.map(toWorkerDTO),
      links: { next: nextLink({ nextPage, request }) },
    };
  }

  /**
   * Retrieves available shifts for a worker, with streak bonus information.
   * @param request - The HTTP request object
   * @param id - The worker ID
   * @param query - Optional filters for job type and location
   * @param page - Pagination parameters
   * @returns Paginated list of available shifts with streak bonus
   */
  @Get("/:id/bonus-shifts")
  async getBonusShifts(
    @Req() request: Request,
    @Param("id", ParseIntPipe) id: number,
    @Query(new ZodValidationPipe(bonusShiftsQuerySchema)) query: BonusShiftsQuery,
    @PaginationPage() page: Page,
  ): Promise<PaginatedResponse<BonusShiftDTO>> {
    const filters = { jobType: query.jobType, location: query.location };
    const { data, nextPage } = await this.service.getBonusShifts({ id, page, filters });

    return {
      data: data.map(toBonusShiftDTO),
      links: { next: nextLink({ nextPage, request }) },
    };
  }
}
