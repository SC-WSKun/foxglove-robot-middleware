import { Module } from '@nestjs/common';
import { DeepseekController } from './deepseek/deepseek.controller';
import { DeepseekService } from './deepseek/deepseek.service';

@Module({
  controllers: [DeepseekController],
  providers: [DeepseekService]
})
export class DeepseekModule {}
