import { Module } from '@nestjs/common';
import { CaseProviderController } from './api/controllers/case-provider.controller';
import { MedicalProviderController } from './api/controllers/medical-provider.controller';
import { CaseProviderRepository } from './infrastructure/repositories/case-provider.repository';
import { MedicalProviderRepository } from './infrastructure/repositories/medical-provider.repository';
import { CreateCaseProviderCommand } from './application/commands/create-case-provider.command';
import { UpdateCaseProviderCommand } from './application/commands/update-case-provider.command';
import { CreateMedicalProviderCommand } from './application/commands/create-medical-provider.command';
import { UpdateMedicalProviderCommand } from './application/commands/update-medical-provider.command';
import { FindAllCaseProvidersQuery } from './application/queries/find-all-case-providers.query';
import { FindCaseProviderByIdQuery } from './application/queries/find-case-provider-by-id.query';
import { FindAllMedicalProvidersQuery } from './application/queries/find-all-medical-providers.query';
import { FindMedicalProviderByIdQuery } from './application/queries/find-medical-provider-by-id.query';

@Module({
  controllers: [CaseProviderController, MedicalProviderController],
  providers: [
    CreateCaseProviderCommand,
    UpdateCaseProviderCommand,
    FindAllCaseProvidersQuery,
    FindCaseProviderByIdQuery,
    CreateMedicalProviderCommand,
    UpdateMedicalProviderCommand,
    FindAllMedicalProvidersQuery,
    FindMedicalProviderByIdQuery,
    { provide: 'ICaseProviderRepository', useClass: CaseProviderRepository },
    { provide: 'IMedicalProviderRepository', useClass: MedicalProviderRepository },
  ],
  exports: ['ICaseProviderRepository', 'IMedicalProviderRepository'],
})
export class NetworkModule {}

