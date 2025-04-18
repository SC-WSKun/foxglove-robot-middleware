import { Body, Controller, Post } from '@nestjs/common'
import { RobotService } from './robot.service'

@Controller('robot')
export class RobotController {
  constructor(private readonly robotService: RobotService) {}

  @Post('test')
  async testQuestion(@Body() body: any) {
    const { question } = body
    const response = this.robotService.testQuery(question)
    return response
  }
}
