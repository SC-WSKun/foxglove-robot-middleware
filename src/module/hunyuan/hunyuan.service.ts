import { HunyuanMessage } from 'src/typing/global';

const tencentcloud = require('tencentcloud-sdk-nodejs');
import { ConfigService } from '@nestjs/config';

const HunyuanClient = tencentcloud.hunyuan.v20230901.Client;

export class HunyuanService {
  private client: any; // HunyuanClient 类型应根据你所使用的 SDK 来定义

  constructor(private configService: ConfigService) {
    // 获取配置项
    const clientId = this.configService.get<string>('clientId');
    const clientKey = this.configService.get<string>('clientKey');

    // 构造 clientConfig
    const clientConfig = {
      credential: {
        secretId: clientId,
        secretKey: clientKey,
      },
      region: 'ap-guangzhou',
      profile: {
        httpProfile: {
          endpoint: 'hunyuan.tencentcloudapi.com',
        },
      },
    };

    // 创建 HunyuanClient 实例
    this.client = new HunyuanClient(clientConfig);
  }

  async askHunYuan(message: HunyuanMessage[]) {
    const params = {
      Model: 'hunyuan-role',
      Messages: message,
      Stream: false,
    };
    return this.client.ChatCompletions(params).then(
      (res) => {
        if (typeof res.on === 'function') {
          // todo: 流式响应
          res.on('message', (message) => {
            console.log(message);
          });
        } else {
          // 非流式响应
          return res.Choices[0].Message;
        }
      },
      (err) => {
        console.error('error', err);
      },
    );
  }
}
