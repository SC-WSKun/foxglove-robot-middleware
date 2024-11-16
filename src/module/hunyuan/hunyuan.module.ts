import { Module } from '@nestjs/common'
import HunyuanController from './hunyuan.controller'
import { HunyuanService } from './hunyuan.service'
import { ConfigModule } from '@nestjs/config'
import { join, resolve } from 'path'
import { FoxgloveModule } from '../foxglove/foxglove.module'
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => require(resolve('src/config/hunyuan.json'))],
    }),
    FoxgloveModule,
  ],
  controllers: [HunyuanController],
  providers: [HunyuanService],
})
export class HunyuanModule {}
