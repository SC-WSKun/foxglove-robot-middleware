import { forwardRef, Module } from '@nestjs/common'
import { AudioStreamGateway } from './wsproxy'
import { RobotModule } from '../robot/robot.module'

@Module({
  imports: [forwardRef(()=>RobotModule)],
  providers: [AudioStreamGateway],
  exports: [AudioStreamGateway],
})
export class TtsModule {}
