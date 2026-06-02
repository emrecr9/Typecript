import { PrismaService } from "../server/src/modules/prisma/prisma.service";
import { getNextWeekLimits, getWeekLimits } from "../server/src/modules/shared/shared.methods";
import { WorkersService } from "../server/src/modules/workers/workers.service";

type Shift = {
    id: number;
    shard: number;
    workerId: number | null;
    createdAt: Date;
    startAt: Date;
    endAt: Date;
    jobType: string;
    workplaceId: number;
    cancelledAt: Date | null;
}
// Creates a mock shift
function buildShift(params: Partial<Shift> = {}): Shift{

  return {
    id: 1,
    workplaceId: 1,
    workerId: 1,
    jobType: "Life Support Technician",
    startAt: new Date(),
    endAt: new Date(),
    createdAt: new Date(),
    cancelledAt: null,
    shard: 0,
    ...params,
  };
}

// Creates shifts in the current week for a worker
function buildCurrentWeekShifts(count: number, workerId: number, workplaceId: number): Shift [] {
  const { startDate } = getWeekLimits(new Date());

  return Array.from({ length: count }, (_, i) =>
    buildShift({
      id: i + 1,
      workerId,
      workplaceId,
      startAt: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000), // one shift per day
    }),
  );
}

//Creates available shifts in the following week for a given workplace
function buildNextWeekShifts(count: number, workplaceId: number): Shift[] {
  const { nextStartDate } = getNextWeekLimits(new Date());

  return Array.from({ length: count }, (_, i) =>
    buildShift({
      id: 100 + i,
      workerId: null,
      workplaceId,
      startAt: new Date(nextStartDate.getTime() + i * 24 * 60 * 60 * 1000),
    }),
  );
}

const mockPrisma = {
  shift: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  worker: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
};

describe("WorkersService - getBonusShifts", () => {
  let service: WorkersService;

  const defaultParams = {
    id: 1,
    page: { num: 1, size: 10, shard: 0 },
    filters: {},
  };

  beforeEach(() => {
    service = new WorkersService(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  it("returns empty list when worker has not worked the current week", async () => {
    // Worker has no shifts this week
    mockPrisma.shift.findMany.mockResolvedValueOnce([]);
    // No next week shifts either
    mockPrisma.shift.findMany.mockResolvedValueOnce([]);
    mockPrisma.shift.count.mockResolvedValue(0);

    const result = await service.getBonusShifts(defaultParams);

    expect(result.data).toEqual([]);
    expect(result.nextPage).toBeUndefined();
  });

  it("returns empty list when worker has only 1 shift on the current week at a workplace", async () => {
    // Worker has only 1 shift this week — not enough for a bonus
    const currentWeekShifts = buildCurrentWeekShifts(1, 1, 1);

    mockPrisma.shift.findMany.mockResolvedValueOnce(currentWeekShifts);
    mockPrisma.shift.findMany.mockResolvedValueOnce([]);
    mockPrisma.shift.count.mockResolvedValue(0);

    const result = await service.getBonusShifts(defaultParams);

    expect(result.data).toEqual([]);
  });

  it("the available shifts for the following week have a 2% bonus because the worker has exactly 2 shifts on the current week at a workplace", async () => {
    const workplaceId = 1;
    const currentWeekShifts = buildCurrentWeekShifts(2, 1, workplaceId);
    const nextWeekShifts = buildNextWeekShifts(2, workplaceId);

    mockPrisma.shift.findMany.mockResolvedValueOnce(currentWeekShifts);
    mockPrisma.shift.findMany.mockResolvedValueOnce(nextWeekShifts);
    mockPrisma.shift.count.mockResolvedValue(0);

    const result = await service.getBonusShifts(defaultParams);

    expect(result.data).toHaveLength(2);
    
    result.data.forEach((shift) => {
      expect(shift.streakBonusPercent).toBe(0.02);
    });
  });

  it("the available shifts for the following week have a 3% bonus when worker has worked 3 or more shifts", async () => {
    const workplaceId = 1;
    const currentWeekShifts = buildCurrentWeekShifts(3, 1, workplaceId);
    const nextWeekShifts = buildNextWeekShifts(2, workplaceId);

    mockPrisma.shift.findMany.mockResolvedValueOnce(currentWeekShifts);
    mockPrisma.shift.findMany.mockResolvedValueOnce(nextWeekShifts);
    mockPrisma.shift.count.mockResolvedValue(0);

    const result = await service.getBonusShifts(defaultParams);

    expect(result.data).toHaveLength(2);

    result.data.forEach((shift) => {
      expect(shift.streakBonusPercent).toBe(0.03);
    });
  });

  it("the correct bonus is given per workplace when worker has shifts at multiple workplaces", async () => {
    // Workplace 1: 2 shifts → 2% bonus
    // Workplace 2: 3 shifts → 3% bonus
    const currentWeekShifts = [
      ...buildCurrentWeekShifts(2, 1, 1),
      ...buildCurrentWeekShifts(3, 1, 2),
    ];
    const nextWeekShifts = [
      ...buildNextWeekShifts(1, 1),
      ...buildNextWeekShifts(1, 2),
    ];

    mockPrisma.shift.findMany.mockResolvedValueOnce(currentWeekShifts);
    mockPrisma.shift.findMany.mockResolvedValueOnce(nextWeekShifts);
    mockPrisma.shift.count.mockResolvedValue(0);

    const result = await service.getBonusShifts(defaultParams);

    const workplace1Shift = result.data.find((s) => s.workplaceId === 1);
    const workplace2Shift = result.data.find((s) => s.workplaceId === 2);

    expect(workplace1Shift?.streakBonusPercent).toBe(0.02);
    expect(workplace2Shift?.streakBonusPercent).toBe(0.03);
  });
});
