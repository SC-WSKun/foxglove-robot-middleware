import { BadGatewayException, Controller, Get, Logger, Post , Body} from '@nestjs/common'
import to from 'await-to-js'
import { HotSpotService } from 'src/module/hotspot/hotspot.service'
import { HotspotDto } from './hotspot.dto'

@Controller('hotspot')
export class HotSpotController {
  private readonly logger = new Logger(HotSpotController.name)
  constructor(private readonly hotSpotService: HotSpotService) {}
  @Get()
  async getHotspot() {
    this.logger.log('--- start get hotspot ---')
    const [err, result] = await to(this.hotSpotService.getWiFiList())
    if (err) {
      this.logger.error(`get hotspot fail: ${err}`)
      throw BadGatewayException
    } else {
      return result
    }
  }

  @Post()
  async connectHotspot(@Body() hotspotDto: HotspotDto) {
    this.logger.log('--- start connect hotspot ---')
    const {ssid, password} = hotspotDto
    const [err, result] = await to(this.hotSpotService.connectHotspot(ssid, password))
    if(err){
      this.logger.error(`connect hotspot fail: ${err}`)
      throw BadGatewayException
    } else {
      return result
    }
  }
}
