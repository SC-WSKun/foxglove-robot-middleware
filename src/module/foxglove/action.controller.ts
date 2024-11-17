import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
} from '@nestjs/common'
import { FoxgloveService } from 'src/module/foxglove/foxglove.service'
import { Move, RobotSpeed } from 'src/typing/action'
import { RobotService } from './robot.service'
import to from 'await-to-js'

@Controller('action')
class ActionController {
  private readonly logger = new Logger('ActionController')
  constructor(
    private foxgloveService: FoxgloveService,
    private robotService: RobotService,
  ) {}

  @Get()
  async getAction() {
    return []
  }

  @Post('move')
  async robotMoving(@Body() robotSpeed: RobotSpeed) {
    this.logger.log('--- start robot moving ---')
    const [err, result] = await to(this.robotService.startMoving(robotSpeed))
    if (err) {
      this.logger.error('move fail')
      throw BadGatewayException
    } else {
      return result
    }
  }

  @Post('move/angular')
  async robotMovingToAngular(@Body() angularDto: { angular: number }) {
    const { angular } = angularDto
    const [err, result] = await to(this.robotService.moveToAngular(angular))
    if (err) {
      throw BadGatewayException
    } else {
      return result
    }
  }

  @Post('move/linear')
  async robotMovingToLinear(@Body() linearDto: { linear: number }) {
    const { linear } = linearDto
    const [err, result] = await to(this.robotService.moveToLinear(linear))
    if (err) {
      throw BadGatewayException
    } else {
      return result
    }
  }
}

export default ActionController
