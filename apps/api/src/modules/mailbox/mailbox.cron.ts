import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RenewSubscriptionsCommand } from "./application/commands/renew-subscriptions.command";

@Injectable()
export class MailboxCron {
  constructor(
    private readonly renewSubscriptionsCommand: RenewSubscriptionsCommand,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async renewSubscriptions() {
    await this.renewSubscriptionsCommand.execute();
  }
}
