import { Module } from '@nestjs/common'
import { HunyuanModule } from './module/hunyuan/hunyuan.module'
import { FoxgloveModule } from './module/foxglove/foxglove.module'
import { HotspotModule } from './module/hotspot/hotspot.module'

@Module({
  imports: [HunyuanModule, FoxgloveModule, HotspotModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
