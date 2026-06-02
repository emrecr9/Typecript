import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { AppModule } from "../server/src/app.module";

describe("Basic Functionality", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("GET /workers/:id/bonus-shifts returns 200", async () => {
    const response = await request(app.getHttpServer()).get("/workers/1/bonus-shifts");
    expect(response.status).toBe(200);
  });

  it("GET /workers/:id/bonus-shifts returns expected shape", async () => {
    const response = await request(app.getHttpServer()).get("/workers/1/bonus-shifts");
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty("links");
  });
});
