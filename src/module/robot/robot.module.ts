import { Module } from '@nestjs/common'
import { RobotController } from './robot.controller'
import { RobotService } from './robot.service'
import { ConfigModule } from '@nestjs/config'
import { resolve } from 'path'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => require(resolve('src/config/qwen.json'))],
    }),
  ],
  controllers: [RobotController],
  providers: [RobotService],
})
export class RobotModule {}
