import { Module } from '@nestjs/common'
import ActionController from './action.controller'
import { FoxgloveService } from './foxglove.service'
import { RobotService } from './robot.service'
import { ConfigModule } from '@nestjs/config'
import { resolve } from 'path'
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => require(resolve('src/config/robot.json'))],
    }),
  ],
  controllers: [ActionController],
  providers: [FoxgloveService, RobotService],
  exports: [FoxgloveService, RobotService],
})
export class FoxgloveModule {}
