import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io' // 用socket.io更灵活
import WebSocket from 'ws'
import crypto from 'crypto'
import zlib from 'zlib'
import { RobotService } from '../robot/robot.service'

function createWebSocketToVolcEngine(): WebSocket {
  return new WebSocket('wss://openspeech.bytedance.com/api/v1/tts/ws_binary', {
    headers: { Authorization: `Bearer; ${process.env.HUOSHAN_TOKEN}` },
  })
}

@WebSocketGateway(3001, {
  cors: {
    origin: '*', // 允许跨域，前端才能连进来
  },
  transports: ['websocket'], // 强制用websocket，不走polling
  namespace: '/audio',
})
export class AudioStreamGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server

  private volcSockets = new Map<string, WebSocket>() // 保存每个client对应的火山WebSocket

  constructor(private readonly robotService: RobotService) {}

  async handleConnection(client: Socket) {
    // 这里可以直接连火山引擎WebSocket
    console.log('handleConnection')
    const volcSocket = createWebSocketToVolcEngine()

    volcSocket.on('open', data => {
      console.log('ws connect success')
    })

    volcSocket.on('message', data => {
      console.log('volcEngine data:', data)
      client.emit('audio-data', data) // 把音频流发给前端
    })

    volcSocket.on('close', () => {
      console.log('VolcEngine WS closed for client:', client.id)
    })

    volcSocket.on('error', error => {
      console.error('VolcEngine WS error:', error)
    })

    this.volcSockets.set(client.id, volcSocket)
  }

  async handleDisconnect(client: Socket) {
    console.log('client disconnected:', client.id)
    const volcSocket = this.volcSockets.get(client.id)
    if (volcSocket) {
      volcSocket.close()
      this.volcSockets.delete(client.id)
    }
  }

  generateHeader() {
    // 组装TTS头部
    const options = {
      protocolVersion: 0b0001,
      headerSizeFlag: 0b0001, // 4 bytes
      messageType: 0b0001,
      messageTypeFlags: 0,
      serializationMethod: 0,
      compressionMethod: 0b0001,
    }
    const header = new Uint8Array(4)
    // 第0字节
    header[0] =
      (options.protocolVersion << 4) | (options.headerSizeFlag & 0b1111)
    // 第1字节
    header[1] = (options.messageType << 4) | (options.messageTypeFlags & 0b1111)
    // 第2字节
    header[2] =
      (options.serializationMethod << 4) | (options.compressionMethod & 0b1111)
    // 第3字节
    header[3] = 0x00 // Reserved，目前设为0

    return header
  }

  generatePayload(text: string) {
    const reqid = crypto.randomUUID()
    const payload = {
      app: {
        appid: process.env.HUOSHAN_APP_ID,
        token: process.env.HUOSHAN_TOKEN,
        cluster: 'volcano_tts',
      },
      user: { uid: '388808087185088' },
      audio: {
        voice_type: 'zh_female_roumeinvyou_emo_v2_mars_bigtts',
        encoding: 'mp3',
        speed_ratio: 1.0,
        loudness_ratio: 2.0,
        pitch_ratio: 1.0,
      },
      request: { reqid, text, text_type: 'plain', operation: 'submit' },
    }
    console.log(payload)
    const payloadStr = JSON.stringify(payload)
    const payloadBuffer = Buffer.from(payloadStr, 'utf8')
    // GZIP压缩
    const compressedPayload = zlib.gzipSync(payloadBuffer)

    // 长度字段 (4字节, 大端)
    const payloadLengthBuffer = Buffer.alloc(4)
    payloadLengthBuffer.writeUInt32BE(compressedPayload.length, 0) // 大端写入
    return {
      compressedPayload,
      payloadLengthBuffer,
    }
  }

  /**
   * 直接语音合成
   * @param data 待合成的文字
   * @param client 和客户端链接的ws
   */
  @SubscribeMessage('send-tts-data')
  async handleTtsRequest(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Received TTS request from client:', data)
    const header = this.generateHeader()
    const { compressedPayload, payloadLengthBuffer } =
      this.generatePayload(data)

    // 最终包
    const message = Buffer.concat([
      header,
      payloadLengthBuffer,
      compressedPayload,
    ]) // 合并header和payload

    const volcSocket = this.volcSockets.get(client.id)
    if (volcSocket && volcSocket.readyState === WebSocket.OPEN) {
      volcSocket.send(message) // 把数据发给火山引擎
    } else {
      console.warn('VolcEngine WS is not ready for client:', client.id)
    }
  }

  /**
   * 执行大模型问答后，返回合成好的音频
   */
  @SubscribeMessage('send-tts-data-after-robot')
  async handleTtsRequestAfterRobot(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Received TTS request from client:', data)
    const answer = await this.robotService.testQuery(data)
    const header = this.generateHeader()
    const { compressedPayload, payloadLengthBuffer } =
      this.generatePayload(answer)
    // 最终包
    const message = Buffer.concat([
      header,
      payloadLengthBuffer,
      compressedPayload,
    ]) // 合并header和payload

    const volcSocket = this.volcSockets.get(client.id)
    if (volcSocket && volcSocket.readyState === WebSocket.OPEN) {
      volcSocket.send(message) // 把数据发给火山引擎
    } else {
      console.warn('VolcEngine WS is not ready for client:', client.id)
    }
  }
}
