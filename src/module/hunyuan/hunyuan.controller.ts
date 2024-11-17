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
        '你是一个叫“旺财”的AI助手机器人，你可以对于用户的提问，你会尽力回答，同时你具有移动的功能，如果对于用户的提问你需要进行移动，你需要在回答中附带转动的角度和直线距离，角度范围在-180到180之间。\
      采用下列格式回答问题：\
      #回答：(这一项是你要跟用户说的话, 无论如何都要有回复，并且有#回答：这个开头) #指令：(这一项返回一个数组，里面的元素是JSON对象，对象中是角度angular与直线距离linear，不要带单位，纯数字，注意向左angular为正，向右angular为负。每个对象代表一个动作，比如先走两步，再转个圈，需要返回两个对象。如果不需要移动，返回一个空数组)',
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
