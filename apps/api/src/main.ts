import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { AppModule } from "./app.module";
// import { GraphService } from './modules/mailbox/application/services/graph.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;

  app.useWebSocketAdapter(new IoAdapter(app));

  // Enable CORS for frontend(s). FRONTEND_URL can be comma-separated (e.g. prod + staging).
  const corsOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin:
      corsOrigins.length > 1
        ? corsOrigins
        : (corsOrigins[0] ?? "http://localhost:5173"),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error("Error starting the application:", error);
  process.exit(1);
});
