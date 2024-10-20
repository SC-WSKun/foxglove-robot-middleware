import { Module } from '@nestjs/common'
import ActionController from './action.controller'
import { FoxgloveService } from './foxglove.service'
@Module({
  controllers: [ActionController],
  providers: [FoxgloveService],
})
export class FoxgloveModule {}
