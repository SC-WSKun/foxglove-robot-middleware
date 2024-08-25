import { Body, Controller, Get, Post } from '@nestjs/common';
import { ActionDto } from 'src/dto/action.dto';

@Controller('action')
class ActionController {
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
