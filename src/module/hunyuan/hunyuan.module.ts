import { Module } from '@nestjs/common'
import HunyuanController from './hunyuan.controller'
import { HunyuanService } from './hunyuan.service'
import { ConfigModule } from '@nestjs/config'
import { join, resolve } from 'path'
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => require(resolve('src/config/hunyuan.json'))],
    }),
  ],
  controllers: [HunyuanController],
  providers: [HunyuanService],
})
export class HunyuanModule {}
