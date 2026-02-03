import { Module, Global } from '@nestjs/common';
import { HttpModule as AxiosHttpModule } from '@nestjs/axios';

/**
 * Global HTTP module
 * Provides HttpService instance to all modules
 */
@Global()
@Module({
  imports: [AxiosHttpModule.register({})],
  exports: [AxiosHttpModule],
})
export class HttpModule {}
