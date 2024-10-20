import { Module } from '@nestjs/common'
import { HunyuanModule } from './module/hunyuan/hunyuan.module'
import { FoxgloveModule } from './module/foxglove/foxglove.module'

@Module({
  imports: [HunyuanModule, FoxgloveModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
