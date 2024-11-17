import { Body, Controller, Logger, Get, Post, Query } from '@nestjs/common'
import { UserMessageDto } from 'src/module/hunyuan/hunyuan.dto'
import { HunyuanService } from 'src/module/hunyuan/hunyuan.service'
import { HunyuanMessage } from 'src/typing/global'
import to from 'await-to-js'
import { FoxgloveService } from '../foxglove/foxglove.service'
import { RobotService } from '../foxglove/robot.service'

@Controller('hunyuan')
class HunyuanController {
  private messages: HunyuanMessage[] = []
  private readonly logger = new Logger(HunyuanController.name)
  constructor(
    private hunyuanService: HunyuanService,
    private foxgloveService: FoxgloveService,
    private robotService: RobotService,
  ) {
    // 初始化人设
    this.messages.push({
      Role: 'system',
      Content:
        '你是一个叫“旺财”的AI助手机器人，你可以对于用户的提问，你会尽力回答，同时你具有移动的功能，如果对于用户的提问你需要进行移动，你需要在回答中附带转动的角度和直线距离，直线的单位是米，角度范围在-180到180之间,向右转为负数，向左转为正数。\
      你的回答是一个JSON对象，其中speech是机器人要回复的内容；command是你要进行移动的指令，且必须是一个对象数组，格式如下：\
      { "speech":"", "command":[{"angular":0, "linear":0}]',
    })
  }

  @Post()
  async getAnswer(@Body() userMessageDto: UserMessageDto) {
    this.messages.push({
      Role: 'user',
      Content: userMessageDto.userMessage,
    })
    const [err, answer] = await to(
      this.hunyuanService.askHunYuan(this.messages),
    )
    if (err) {
      this.logger.error('askHunyuan error:', err)
    }
    this.logger.log('askhunyuan result:', answer)
    this.messages.push(answer)
    let { speech, command } = this.foxgloveService.formatAiAnswer(
      answer.Content,
    )
    if (!speech) {
      speech = '旺财听不太懂你在说什么，请重新说一次吧'
    }
    if (command) {
      this.robotService.handleMoveCommand(command)
    }
    this.logger.log('messages:', this.messages)
    return speech
  }

  @Post('tts')
  async test(@Body() testParam) {
    const { text } = testParam
    const [err, answer] = await to(this.hunyuanService.answerToSound(text))
    if (err) {
      this.logger.error('test error:', err)
    }
    this.logger.log(`tts complete`)
    return answer
  }
}

export default HunyuanController
