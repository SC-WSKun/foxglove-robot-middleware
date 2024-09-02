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
  systemTemplate = [
    {
      Role: 'system',
      Content: '你是一个叫“旺财”的AI助手机器人',
    },
  ];

  async askHunYuan(message: string) {
    const userMessage = [
      {
        Role: 'user',
        Content: message,
      },
    ];
    const params = {
      Model: 'hunyuan-role',
      Messages: this.systemTemplate.concat(userMessage),
      Stream: false,
    };
    client.ChatCompletions(params).then(
      async (res) => {
        if (typeof res.on === 'function') {
          // todo: 流式响应
          res.on('message', (message) => {
            console.log(message);
          });
        } else {
          // 非流式响应
          console.log(res);
        }
      },
      (err) => {
        console.error('error', err);
      },
    );
  }
}
