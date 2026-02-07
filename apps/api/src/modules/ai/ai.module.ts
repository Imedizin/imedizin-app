import { Module } from "@nestjs/common";
import { AIModelService } from "./aimodel.service";

@Module({
  providers: [AIModelService],
  exports: [AIModelService],
})
export class AiModule {}
