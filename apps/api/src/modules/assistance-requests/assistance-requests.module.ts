import { Module } from "@nestjs/common";
import { MailboxModule } from "../mailbox/mailbox.module";
import { AiModule } from "../ai/ai.module";
import { AssistanceRequestController } from "./api/controllers/assistance-request.controller";
import { AssistanceRequestRepository } from "./infrastructure/repositories/assistance-request.repository";
import { CreateTransportRequestCommand } from "./application/commands/create-transport-request.command";
import { CreateMedicalRequestCommand } from "./application/commands/create-medical-request.command";
import { UpdateTransportRequestCommand } from "./application/commands/update-transport-request.command";
import { UpdateMedicalRequestCommand } from "./application/commands/update-medical-request.command";
import { LinkThreadCommand } from "./application/commands/link-thread.command";
import { UnlinkThreadCommand } from "./application/commands/unlink-thread.command";
import { ExtractAssistanceRequestFromEmailCommand } from "./application/commands/extract-assistance-request-from-email.command";
import { FindAllAssistanceRequestsQuery } from "./application/queries/find-all-assistance-requests.query";
import { FindAssistanceRequestByIdQuery } from "./application/queries/find-assistance-request-by-id.query";

@Module({
  imports: [MailboxModule, AiModule],
  controllers: [AssistanceRequestController],
  providers: [
    CreateTransportRequestCommand,
    CreateMedicalRequestCommand,
    UpdateTransportRequestCommand,
    UpdateMedicalRequestCommand,
    LinkThreadCommand,
    UnlinkThreadCommand,
    ExtractAssistanceRequestFromEmailCommand,
    FindAllAssistanceRequestsQuery,
    FindAssistanceRequestByIdQuery,
    {
      provide: "IAssistanceRequestRepository",
      useClass: AssistanceRequestRepository,
    },
  ],
  exports: ["IAssistanceRequestRepository"],
})
export class AssistanceRequestsModule {}
