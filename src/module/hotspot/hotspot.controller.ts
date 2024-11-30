import { BadGatewayException, Controller, Get, Logger } from '@nestjs/common'
import to from 'await-to-js'
import { HotSpotService } from 'src/module/hotspot/hotspot.service'

@Controller('hotspot')
export class HotSpotController {
  private readonly logger = new Logger(HotSpotController.name)
  constructor(private readonly hotSpotService: HotSpotService) {}
  @Get()
  async getHotspot() {
    const [err, result] = await to(this.hotSpotService.getWiFiList())
    if (err) {
      throw BadGatewayException
    } else {
      return result
    }
  }
}
