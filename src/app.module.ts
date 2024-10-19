import { Module } from '@nestjs/common';
import ActionController from './module/foxglove/action.controller';
import { FoxgloveService } from './module/foxglove/foxglove.service';
import HunyuanController from './module/hunyuan/hunyuan.controller';
import { HunyuanService } from './module/hunyuan/hunyuan.service';
import { ConfigModule } from '@nestjs/config';
import { HunyuanModule } from './module/hunyuan/hunyuan.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => require('./config/hunyuan.json')],
    }),
    HunyuanModule,
  ],
  controllers: [ActionController],
  providers: [FoxgloveService],
})
export class AppModule {}
