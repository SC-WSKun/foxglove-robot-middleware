import { Module } from '@nestjs/common'
import { HotSpotService } from './hotspot.service'
import { HotSpotController } from './hotspot.controller'

@Module({
  imports: [],
  controllers: [HotSpotController],
  providers: [HotSpotService],
})
export class HotspotModule {}
