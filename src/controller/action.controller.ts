import { Body, Controller, Get, Post } from '@nestjs/common';
import { ActionDto } from 'src/dto/action.dto';
import { FoxgloveService } from 'src/service/foxglove.service';
import { TOPIC_LIST } from 'src/typing/topic';

@Controller('action')
class ActionController {
  callbacks = {
    [TOPIC_LIST.TF]: this.carPositionListener,
  };

  constructor(private foxgloveService: FoxgloveService) {
    foxgloveService.initClient('ws://10.3.51.225:8765');
  }

  @Get()
  async getAction() {
    return [];
  }

  // ActionDto:
  //  action: string
  //  data: string
  @Post()
  playAction(@Body() robotAction: ActionDto) {
    switch (robotAction.action) {
      case 'subscribeTopic':
        this.foxgloveService.subscribeTopic(robotAction.data);
        break;
      case 'movingPrepare':
        this.foxgloveService.subscribeTopic(TOPIC_LIST.TF);
        this.foxgloveService.addHandler(
          TOPIC_LIST.TF,
          this.callbacks[TOPIC_LIST.TF],
        );
        break;
    }

    //...
    return {
      errCode: 0,
      action: robotAction,
    };
  }

  carPositionListener(timestamp: bigint, data: any) {
    console.log('timestamp: ', timestamp, 'data: ', data);
  }
}

export default ActionController;
