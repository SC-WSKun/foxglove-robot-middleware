import { Module } from '@nestjs/common'
import { HunyuanModule } from './module/hunyuan/hunyuan.module'
import { FoxgloveModule } from './module/foxglove/foxglove.module'
import { HotspotModule } from './module/hotspot/hotspot.module'
import { LabelModule } from './module/label/label.module'

@Module({
  imports: [HunyuanModule, FoxgloveModule, HotspotModule, LabelModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
