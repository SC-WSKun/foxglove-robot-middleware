import { Body, Controller, Get, Post } from '@nestjs/common';
import { ActionDto } from 'src/dto/action.dto';
import { FoxgloveService } from 'src/service/foxglove.service';

@Controller('action')
class ActionController {
  constructor(private foxgloveService: FoxgloveService) {
    foxgloveService.initClient('ws://localhost:8765');
  }

  @Get()
  async getAction() {
    return [];
  }

  @Post()
  playAction(@Body() robotAction: ActionDto) {
    //...
    return {
      errCode: 0,
      action: robotAction,
    };
  }
}

export default ActionController;
