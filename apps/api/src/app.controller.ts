import { Controller, Get, HttpCode, HttpStatus, Inject } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { AppService } from "./app.service";
import type { Database } from "./shared/common/database/database.module";
import { DRIZZLE } from "./shared/common/database/database.module";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  health(): { status: string } {
    return { status: "ok" };
  }

  @Get("health/db")
  @HttpCode(HttpStatus.OK)
  async healthDb(): Promise<{ status: string; database: string }> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return { status: "ok", database: "connected" };
    } catch {
      return { status: "error", database: "disconnected" };
    }
  }
}
