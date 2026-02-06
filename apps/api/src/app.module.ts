import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { BullModule } from "@nestjs/bullmq";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { KernelModule } from "./shared/kernel/kernel.module";
import { DatabaseModule } from "./shared/common/database/database.module";
import { HttpModule } from "./shared/common/http/http.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { MailboxModule } from "./modules/mailbox/mailbox.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AmbulanceTransportationModule } from "./modules/operations/ambulance-transportation/ambulance-transportation.module";
import { NetworkModule } from "./modules/network/network.module";

/**
 * Root application module
 * Implements modular monolith architecture
 *
 * Structure:
 * - shared/: Shared kernel and common modules (database, utilities)
 * - modules/: Business modules (iam, tickets, etc.)
 *
 * Each module follows layered architecture:
 * - domain/: Entities, value objects, domain services
 * - application/: Use cases, DTOs, application services
 * - infrastructure/: Repository implementations, external integrations
 * - api/: HTTP controllers, route handlers
 */
@Module({
  imports: [
    // Global configuration (loads .env from apps/api when run via pnpm --filter)
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Domain events (global) - commands emit events; handlers push to realtime, etc.
    EventEmitterModule.forRoot(),
    // Schedule module (global) - enables cron jobs and scheduled tasks
    ScheduleModule.forRoot(),
    // Shared kernel (base classes, exceptions, interfaces)
    KernelModule,
    // Database module (global)
    DatabaseModule,
    // HTTP client module (global) - enables HTTP requests across modules
    HttpModule,
    // BullMQ (Redis) - job queues for webhook processing
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>("REDIS_HOST", "localhost"),
          port: config.get<number>("REDIS_PORT", 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullBoardModule.forRoot({
      route: "/queues",
      adapter: ExpressAdapter,
    }),
    // Public attachments bucket (ATTACHMENTS_PATH served at /attachments)
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: join(
            process.cwd(),
            config.get<string>("ATTACHMENTS_PATH", "./data/attachments")
          ),
          serveRoot: "/attachments",
        },
      ],
    }),
    // Business modules
    RealtimeModule,
    NotificationsModule,
    MailboxModule,
    AmbulanceTransportationModule,
    NetworkModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
