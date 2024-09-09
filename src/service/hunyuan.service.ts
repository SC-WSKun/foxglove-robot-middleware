import { HunyuanMessage } from 'src/typing/global';

const tencentcloud = require('tencentcloud-sdk-nodejs');

const HunyuanClient = tencentcloud.hunyuan.v20230901.Client;

const clientConfig = {
  credential: {
    secretId: '',
    secretKey: '',
  },
  region: 'ap-guangzhou',
  profile: {
    httpProfile: {
      endpoint: 'hunyuan.tencentcloudapi.com',
    },
  },
};

const client = new HunyuanClient(clientConfig);

export class HunyuanService {
  async askHunYuan(message: HunyuanMessage[]) {
    const params = {
      Model: 'hunyuan-role',
      Messages: message,
      Stream: false,
    };
    return client.ChatCompletions(params).then(
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
