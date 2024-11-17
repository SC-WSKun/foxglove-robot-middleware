import { Injectable, Logger } from '@nestjs/common'
import {
  Channel,
  ClientChannelWithoutId,
  FoxgloveClient,
  SubscriptionId,
} from '@foxglove/ws-protocol'
import { parse as parseMessageDefinition } from '@foxglove/rosmsg'
import { MessageReader } from '@foxglove/rosmsg2-serialization'
import { find } from 'lodash'
import { MessageWriter } from '@foxglove/rosmsg2-serialization'
import { ConfigService } from '@nestjs/config'
import { setUncaughtExceptionCaptureCallback } from 'process'
const WebSocket = require('ws')

@Injectable()
export class FoxgloveService {
  connected: boolean = false
  client: FoxgloveClient
  subChannels: Map<SubscriptionId, Channel> = new Map() // Map of channels from server advertise
  pubChannels: Map<string, ClientChannelWithoutId & { id: number }> = new Map() // Map of channels from server advertise
  subs: Map<string, { subId: number; channelId: number }> = new Map()
  callbacks: { [key: number]: (timestamp: bigint, data: any) => void } = {} // Array of subscriptions
  private readonly logger = new Logger('FoxgloveService')
  constructor(private configService: ConfigService) {
    const ws_url = this.configService.get<string>('ws_url')
    this.initClient(ws_url)
  }

  // 建立链接
  async initClient(url: string) {
    const address =
      url.startsWith('ws://') || url.startsWith('wss://') ? url : `ws://${url}`
    this.logger.log(`Client connecting to ${address}`)

    this.client = new FoxgloveClient({
      ws: new WebSocket(address, [FoxgloveClient.SUPPORTED_SUBPROTOCOL]),
    })

    this.client.on('open', () => {
      this.logger.log('Connected Successfully!')
      this.connected = true
    })

    this.client.on('close', () => {
      this.logger.log('Connection closed')
      this.connected = false
    })

    this.client.on('error', error => {
      this.logger.log('ws client error', error)
      throw error
    })

    this.client.on('advertise', channels => {
      for (const channel of channels) {
        this.subChannels.set(channel.id, channel)
      }
      this.logger.log(`server channels number: ${this.subChannels.size}`)
    })

    this.client.on('message', ({ subscriptionId, timestamp, data }) => {
      if (this.callbacks[subscriptionId]) {
        this.callbacks[subscriptionId](timestamp, data)
      } else {
        this.logger.log('No callback for subscriptionId:', subscriptionId)
      }
    })
  }

  /** subscribe topic
   * @param the name of topic will be subcribed
   * @return id of subcribe channel
   */
  subscribeTopic(topic: string) {
    if (!this.client) {
      return Promise.reject('Client not initialized')
    }

    const channel = find(Array.from(this.subChannels.values()), { topic })
    if (!channel) {
      return Promise.reject('Channel not found')
    }

    // Subscribe to the channel
    const subId = this.client.subscribe(channel.id)

    this.subs.set(topic, {
      subId,
      channelId: channel.id,
    })
    return Promise.resolve(subId)
  }

  advertiseTopic(channel: ClientChannelWithoutId) {
    this.logger.log('--- start advertise topic ---')
    if (!this.client) {
      return Promise.reject('Client not initialized')
    }
    try {
      const channelId = this.client.advertise(channel)
      if (channelId) {
        this.pubChannels.set(channel.topic, { ...channel, id: channelId })
      }
      return Promise.resolve(channel.topic)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  publishMessage(topic: string, message: any) {
    this.logger.log('--- start publish message ---')
    this.logger.log(`public topic: ${topic}`)
    this.logger.log(`public message: ${message}`)
    if (!this.client) {
      return Promise.reject('Client not initialized')
    }
    const channel = this.pubChannels.get(topic)
    if (!channel) {
      return Promise.reject('Channel not found')
    }
    const parseDefinitions = parseMessageDefinition(channel.schema, {
      ros2: true,
    })
    const writer = new MessageWriter(parseDefinitions)
    const uint8Array = writer.writeMessage(message)
    try {
      this.client.sendMessage(channel.id, uint8Array)
      return Promise.resolve('send success')
    } catch (error) {
      this.logger.error('send message fail:', error)
      return Promise.reject('send message fail')
    }
  }

  addHandler(topic: string, callback: (...args: any) => void) {
    if (!this.client) {
      return Promise.reject('foxglove client is not initialized')
    }
    const channel = this.subs.get(topic)
    if (!channel) {
      return Promise.reject('Channel not found')
    }
    if (this.callbacks[channel.subId]) {
      return Promise.reject('Callback already exist')
    }
    this.callbacks[channel.subId] = callback
    return Promise.resolve(channel.subId)
  }

  readMsgWithSubId(topic: string, data: DataView) {
    const sub = this.subs.get(topic)
    if (sub) {
      const channel = this.subChannels.get(sub.channelId)
      const parseDefinitions = parseMessageDefinition(channel?.schema!, {
        ros2: true,
      })
      const reader = new MessageReader(parseDefinitions)
      if (!data) {
        this.logger.error('data is undefined')
        return undefined
      }
      return reader.readMessage(data)
    } else {
      this.logger.error('sub not found')
    }
  }
  formatAiAnswer(inputString: string) {
    this.logger.log('--- start format ai answer ---')
    this.logger.log('inputString:', inputString)
    // 使用正则提取“回答”和“指令”
    const answerRegex = /#回答：([^#]+)/
    const commandRegex = /#指令：(\[.*\])/

    // 提取回答和指令
    const speech = (inputString.match(answerRegex) || [])[1]?.trim() || ''
    const commandString =
      (inputString.match(commandRegex) || [])[1]?.trim() || '[]'

    // 解析指令（数组格式）
    const command = JSON.parse(commandString)
    this.logger.log('解析解答:', speech)
    this.logger.log('解析指令:', command)
    return {
      speech,
      command,
    }
  }
}
