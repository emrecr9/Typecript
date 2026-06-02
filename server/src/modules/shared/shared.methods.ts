import { Prisma } from "@prisma/client";
import { Filters } from "./shared.types";

export function buildWhereFilter(filters: Filters): Prisma.ShiftWhereInput {
    const where: Prisma.ShiftWhereInput = {};

    if (filters.jobType) {
        where.jobType = filters.jobType;
    }

    if (filters.location) {
        where.workplace = { location: filters.location };
    }

    if (filters.workerId === null) {
        where.workerId = null;
    } else if (typeof filters.workerId === "number") {
        where.workerId = filters.workerId;
    }

    return where;
}

export function getWeekLimits(date: Date): { startDate: Date; endDate: Date } {
    // that week's monday at 0:00 am
    const startDate =  new Date(date);

    startDate.setDate(date.getDate() - (date.getDay() + 6) % 7);
    startDate.setHours(0, 0, 0, 0);

    // that week's subday at 11:59 pm
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    return {
        startDate,
        endDate
    }
}

export function getNextWeekLimits(date: Date): { nextStartDate: Date; nextEndDate: Date } {
    const currentWeekLimits = getWeekLimits(date);
    const nextStartDate =  new Date(currentWeekLimits.startDate);

    nextStartDate.setDate(nextStartDate.getDate() + 7);
    
    const nextEndDate = new Date(nextStartDate);

    nextEndDate.setDate(nextEndDate.getDate() + 6);
    nextEndDate.setHours(23, 59, 59, 999);

    return {
        nextStartDate,
        nextEndDate
    }
}