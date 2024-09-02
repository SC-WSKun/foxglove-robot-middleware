import { Module } from '@nestjs/common';
import ActionController from './controller/action.controller';
import { FoxgloveService } from './service/foxglove.service';
import HunyuanController from './controller/hunyuan.controller';
import { HunyuanService } from './service/hunyuan.service';

@Module({
  imports: [],
  controllers: [ActionController, HunyuanController],
  providers: [FoxgloveService, HunyuanService],
})
export class AppModule {}
