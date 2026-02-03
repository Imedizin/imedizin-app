import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
// Import all module schemas
import * as mailboxSchema from '../../../modules/mailbox/infrastructure/schema';
import * as ambulanceTransportationSchema from '../../../modules/operations/ambulance-transportation/infrastructure/schema';

// Combine all schemas into one object for Drizzle
const schema = {
  ...mailboxSchema,
  ...ambulanceTransportationSchema,
};

export const DRIZZLE = 'DRIZZLE' as const;

export type Database = NodePgDatabase<typeof schema>;

/**
 * Global database module
 * Provides Drizzle ORM instance to all modules
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          connectionString: configService.get<string>('DATABASE_URL'),
        });

        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
