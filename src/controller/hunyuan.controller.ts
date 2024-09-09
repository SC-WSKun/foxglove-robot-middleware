import { Body, Controller, Post } from '@nestjs/common';
import { UserMessageDto } from 'src/dto/hunyuan.dto';
import { HunyuanService } from 'src/service/hunyuan.service';
import { HunyuanMessage } from 'src/typing/global';

@Controller('hunyuan')
class HunyuanController {
  private messages: HunyuanMessage[] = [];
  constructor(private hunyuanService: HunyuanService) {
    // 初始化人设
    this.messages.push({
      Role: 'system',
      Content: '你是一个叫“旺财”的AI助手机器人',
    });
  }

  @Post()
  async getAnswer(@Body() userMessageDto: UserMessageDto) {
    this.messages.push({
      Role: 'user',
      Content: userMessageDto.userMessage,
    });
    const answer = await this.hunyuanService.askHunYuan(this.messages);
    this.messages.push(answer);
    return answer.Content;
  }
}

export default HunyuanController;
