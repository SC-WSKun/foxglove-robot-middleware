import { Body, Controller, Logger, Post } from '@nestjs/common'
import { UserMessageDto } from 'src/module/hunyuan/hunyuan.dto'
import { HunyuanService } from 'src/module/hunyuan/hunyuan.service'
import { HunyuanMessage } from 'src/typing/global'
import to from 'await-to-js'

@Controller('hunyuan')
class HunyuanController {
  private messages: HunyuanMessage[] = []
  private readonly logger = new Logger(HunyuanController.name)
  constructor(private hunyuanService: HunyuanService) {
    // 初始化人设
    this.messages.push({
      Role: 'system',
      Content: '你是一个叫“旺财”的AI助手机器人',
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
    this.logger.log('messages:', this.messages)
    return answer.Content
  }
}

export default HunyuanController
