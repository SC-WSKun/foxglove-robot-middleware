import { Body, Controller, Post } from '@nestjs/common'
import { RobotService } from './robot.service'
import { AudioStreamGateway } from '../tts/wsproxy'

@Controller('robot')
export class RobotController {
  constructor(private readonly robotService: RobotService, private readonly audioStreamGateway: AudioStreamGateway) {}

  @Post('test')
  async testQuestion(@Body() body: any) {
    const { question } = body
    const response = await this.robotService.testQuery(question)
    this.audioStreamGateway.ttsRequestFromOtherService(response)
    return response
  }
}
