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
import { getPage, nextLink } from "../shared/pagination";
import { PaginatedResponse, type Response } from "../shared/shared.types";
import { toShiftDTO } from "./shifts.mapper";
import {
  type CreateShift,
  createShiftSchema,
  GetShiftsQuery,
  getShiftsQuerySchema,
  ShiftDTO,
} from "./shifts.schemas";
import { ShiftsService } from "./shifts.service";

@Controller("shifts")
export class ShiftsController {
  constructor(private readonly service: ShiftsService) {}

  /**
   * Creates a new shift
   * @param data - The shift data to create
   * @returns The created shift
   */
  @Post()
  @UsePipes(new ZodValidationPipe(createShiftSchema))
  async create(@Body() data: CreateShift): Promise<Response<ShiftDTO>> {
    return { data: toShiftDTO(await this.service.create(data)) };
  }

  /**
   * Retrieves a shift by its ID
   * @param id - The shift ID
   * @returns The shift data
   * @throws Error when shift is not found
   */
  @Get("/:id")
  async getById(@Param("id", ParseIntPipe) id: number): Promise<Response<ShiftDTO>> {
    const data = await this.service.getById(id);
    if (!data) {
      throw new Error(`ID ${id} not found.`);
    }

    return { data: toShiftDTO(data) };
  }

  /**
   * Retrieves a paginated list of shifts with optional filtering.
   * @param request - The HTTP request object
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of shifts
   */
  @Get()
  @UsePipes(new ZodValidationPipe(getShiftsQuerySchema))
  async get(
    @Req() request: Request,
    @Query() query: GetShiftsQuery,
  ): Promise<PaginatedResponse<ShiftDTO>> {
    const page = getPage(query.page, query.shard);
    const filters = { workerId: query.workerId, jobType: query.jobType, location: query.location };
    const { data, nextPage } = await this.service.get({ page, filters });

    return {
      data: data.map(toShiftDTO),
      links: { next: nextLink({ nextPage, request }) },
    };
  }

  /**
   * Claims a shift for a worker
   * @param id - The shift ID to claim
   * @param workerId - The worker ID claiming the shift
   * @returns The updated shift data
   */
  @Post("/:id/claim")
  async claim(
    @Param("id", ParseIntPipe) id: number,
    @Body("workerId", ParseIntPipe) workerId: number,
  ): Promise<Response<ShiftDTO>> {
    return { data: toShiftDTO(await this.service.claim(id, workerId)) };
  }

  /**
   * Cancels a claimed shift
   * @param id - The shift ID to cancel
   * @returns The updated shift data
   * @throws Error when shift is not found or not claimed
   */
  @Post("/:id/cancel")
  async cancel(@Param("id", ParseIntPipe) id: number): Promise<Response<ShiftDTO>> {
    const data = await this.service.getById(id);

    if (!data) {
      throw new Error(`ID ${id} not found.`);
    }

    if (!data.workerId) {
      throw new Error(`Shift ${id} is not claimed.`);
    }

    return { data: toShiftDTO(await this.service.cancel(id)) };
  }
}
