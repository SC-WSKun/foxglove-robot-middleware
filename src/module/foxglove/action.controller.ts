import { Body, Controller, Get, Post } from '@nestjs/common'
import { ActionDto } from 'src/module/foxglove/action.dto'
import { FoxgloveService } from 'src/module/foxglove/foxglove.service'
import { TOPIC_LIST } from 'src/typing/topic'

@Controller('action')
class ActionController {
  callbacks = {
    [TOPIC_LIST.TF]: this.carPositionListener,
  }

  constructor(private foxgloveService: FoxgloveService) {
    // foxgloveService.initClient('ws://10.3.51.225:8765');
  }

  @Get()
  async getAction() {
    return []
  }

  // ActionDto:
  //  action: string
  //  data: string
  @Post()
  playAction(@Body() robotAction: ActionDto) {
    switch (robotAction.action) {
      case 'subscribeTopic':
        this.foxgloveService.subscribeTopic(robotAction.data)
        break
      case 'movingPrepare':
        // 订阅TF
        this.foxgloveService.subscribeTopic(TOPIC_LIST.TF)
        this.foxgloveService.addHandler(
          TOPIC_LIST.TF,
          this.callbacks[TOPIC_LIST.TF],
        )
        // 发布移动Topic
        this.foxgloveService.advertiseTopic({
          encoding: 'cdr',
          schema:
            '# This expresses velocity in free space broken into its linear and angular parts.\n\nVector3  linear\nVector3  angular\n\n================================================================================\nMSG: geometry_msgs/Vector3\n# This represents a vector in free space.\n\n# This is semantically different than a point.\n# A vector is always anchored at the origin.\n# When a transform is applied to a vector, only the rotational component is applied.\n\nfloat64 x\nfloat64 y\nfloat64 z\n',
          schemaEncoding: 'ros2msg',
          schemaName: 'geometry_msgs/msg/Twist',
          topic: TOPIC_LIST.MOVE,
        })
        break
      case 'moving':
        this.foxgloveService.publishMessage(
          TOPIC_LIST.MOVE,
          JSON.parse(robotAction.data),
        )
        break
    }

    //...
    return {
      errCode: 0,
      action: robotAction,
    }
  }

  carPositionListener(timestamp: bigint, data: any) {
    console.log('timestamp: ', timestamp, 'data: ', data)
  }
}

export default ActionController
