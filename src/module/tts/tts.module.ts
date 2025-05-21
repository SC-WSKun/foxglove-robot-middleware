import { Module } from '@nestjs/common';
import { TtsService } from './tts.service';
import { AudioStreamGateway } from './wsproxy';
import { RobotModule } from '../robot/robot.module';

@Module({
  imports: [RobotModule],
  providers: [TtsService, AudioStreamGateway]
})
export class TtsModule {}
