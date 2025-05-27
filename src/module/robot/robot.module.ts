import { forwardRef, Module } from '@nestjs/common'
import { RobotController } from './robot.controller'
import { RobotService } from './robot.service'
import { ConfigModule } from '@nestjs/config'
import { resolve } from 'path'
import { TtsModule } from '../tts/tts.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => require(resolve('src/config/qwen.json'))],
    }),
    forwardRef(()=>TtsModule),
  ],
  controllers: [RobotController],
  providers: [RobotService],
  exports: [RobotService],
})
export class RobotModule {}
