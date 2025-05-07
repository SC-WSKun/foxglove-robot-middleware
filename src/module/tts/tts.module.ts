import { Module } from '@nestjs/common';
import { TtsService } from './tts.service';
import { AudioStreamGateway } from './wsproxy';

@Module({
  providers: [TtsService, AudioStreamGateway]
})
export class TtsModule {}
