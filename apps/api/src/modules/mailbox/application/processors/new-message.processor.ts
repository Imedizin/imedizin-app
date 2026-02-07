import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { ProcessNewMessageCommand } from "../commands/process-new-message.command";
import type { NewMessageJobPayload } from "../commands/process-new-message.command";

export const NEW_MESSAGE_QUEUE = "new-message";

@Processor(NEW_MESSAGE_QUEUE)
export class NewMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(NewMessageProcessor.name);

  constructor(
    private readonly processNewMessageCommand: ProcessNewMessageCommand,
  ) {
    super();
  }

  async process(job: Job<NewMessageJobPayload, void, string>): Promise<void> {
    this.logger.log(`Processing job ${job.id} (mailboxId:messageId)`);
    await this.processNewMessageCommand.execute(job.data);
  }
}
