import { Module } from '@nestjs/common';
import ActionController from './controller/action.controller';
import { FoxgloveService } from './service/foxglove.service';

@Module({
  imports: [],
  controllers: [ActionController],
  providers: [FoxgloveService],
})
export class AppModule {}
