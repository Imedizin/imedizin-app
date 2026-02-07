import { Module, Global } from "@nestjs/common";

/**
 * Global kernel module providing base classes, exceptions, and interfaces
 * This module is global so it can be used across all modules without explicit imports
 */
@Global()
@Module({})
export class KernelModule {}
