import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserMessageDto } from 'src/dto/hunyuan.dto';
import { HunyuanService } from 'src/service/hunyuan.service';

@Controller('hunyuan')
class HunyuanController {
  constructor(private hunyuanService: HunyuanService) {}

  @Post()
  getAnswer(@Body() userMessageDto: UserMessageDto) {
    this.hunyuanService.askHunYuan(userMessageDto.userMessage);
  }
}

export default HunyuanController;
