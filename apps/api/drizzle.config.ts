import type { Config } from "drizzle-kit";

export default {
  schema: [
    // Module schemas - each module owns its database schema
    "./src/modules/mailbox/infrastructure/schema.ts",
    "./src/modules/notifications/infrastructure/schema.ts",
    "./src/modules/operations/ambulance-transportation/infrastructure/schema.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
