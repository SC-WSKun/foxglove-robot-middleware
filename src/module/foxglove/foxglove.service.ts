import { Injectable, Logger } from '@nestjs/common'
import {
  Channel,
  ClientChannelWithoutId,
  FoxgloveClient,
  SubscriptionId,
  type Service,
  type ServerInfo,
} from '@foxglove/ws-protocol'
import { parse as parseMessageDefinition } from '@foxglove/rosmsg'
import { MessageReader } from '@foxglove/rosmsg2-serialization'
import { find } from 'lodash'
import { MessageWriter } from '@foxglove/rosmsg2-serialization'
import { ConfigService } from '@nestjs/config'
const _ = require('lodash')
const WebSocket = require('ws')

@Injectable()
export class FoxgloveService {
  connected: boolean = false
  client: FoxgloveClient
  subChannels: Map<SubscriptionId, Channel> = new Map() // Map of channels from server advertise
  pubChannels: Map<string, ClientChannelWithoutId & { id: number }> = new Map() // Map of channels from server advertise
  subs: Map<string, { subId: number; channelId: number }> = new Map()
  callbacks: { [key: number]: (timestamp: bigint, data: any) => void } = {} // Array of subscriptions
  services: Service[] = [] // Array of services from server advertise
  msgEncoding: string = 'cdr'
  callServiceId: number = 0 // id of called service
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
      this.logger.log('FoxgloveClient Connected Successfully!')
      this.connected = true
    })

    this.client.on('close', () => {
      this.logger.log('FoxgloveCLient Connection closed')
      this.connected = false

      // 重新连接
      this.retryConnection(address)
    })

    this.client.on('error', error => {
      this.logger.log('FoxgloveClient error', error)
      // 重新连接
      this.retryConnection(address)
    })

    this.client.on('advertise', channels => {
      for (const channel of channels) {
        this.subChannels.set(channel.id, channel)
      }
      this.logger.log(`server channels number: ${this.subChannels.size}`)
    })

    this.client.on('unadvertise', (channelIds: number[]) => {
      channelIds.forEach((id: number) => {
        this.subChannels.delete(id)
      })
      this.logger.log(`current subChannels: ${this.subChannels}`)
    })

    this.client.on('advertiseServices', (services: Service[]) => {
      this.logger.log(`receive services:${services?.length}`)
      this.services.push(...services)
    })

    this.client.on('message', ({ subscriptionId, timestamp, data }) => {
      if (this.callbacks[subscriptionId]) {
        this.callbacks[subscriptionId](timestamp, data)
      } else {
        this.logger.log(`No callback for subscriptionId: ${subscriptionId}`)
      }
    })
    this.client.on('serverInfo', (serverInfo: ServerInfo) => {
      if (serverInfo.supportedEncodings) {
        this.msgEncoding = serverInfo.supportedEncodings[0]
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
    this.logger.debug(`public topic: ${topic}`)
    this.logger.debug(`public message: ${JSON.stringify(message)}`)
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

  /**
   * call service
   * @param srvName service name
   * @param payload request params
   * @returns a promise wait for the response
   */
  callService(srvName: string, payload: { [key: string]: any }): Promise<any> {
    if (!this.client) {
      return Promise.reject('Client not initialized!')
    }
    const srv: Service | undefined = _.find(this.services, { name: srvName })

    if (!srv) {
      return Promise.reject('Service not found!')
    }
    const parseReqDefinitions = parseMessageDefinition(srv?.requestSchema!, {
      ros2: true,
    })
    const writer = new MessageWriter(parseReqDefinitions)
    const uint8Array = writer.writeMessage(payload)
    this.client.sendServiceCallRequest({
      serviceId: srv?.id!,
      callId: ++this.callServiceId,
      encoding: this.msgEncoding,
      data: new DataView(uint8Array.buffer),
    })
    return new Promise(resolve => {
      // 将监听回调函数抽离的目的是避免监听未及时off造成的内存泄漏
      function serviceResponseHandler(response: any) {
        const parseResDefinitions = parseMessageDefinition(
          srv?.responseSchema!,
          {
            ros2: true,
          },
        )
        const reader = new MessageReader(parseResDefinitions)
        const res = reader.readMessage(response.data)
        resolve(res)
        this.client?.off('serviceCallResponse', serviceResponseHandler)
      }
      this!.client!.on('serviceCallResponse', serviceResponseHandler)
    })
  }

  /**
   * format ai answer
   */
  formatAiAnswer(inputString: string) {
    this.logger.log('--- start format ai answer ---')
    this.logger.log('inputString:', inputString)
    try {
      if (!_.startsWith(inputString, '{')) {
        inputString = inputString.replace(/^(.*?)\{/, '{')
      }
      const { speech, command } = JSON.parse(inputString)
      return {
        speech,
        command,
      }
    } catch (error) {
      this.logger.error('json parse fail')
      return {
        speech: '',
        command: [],
      }
    }
  }

  /**
   * retry connection
   */
  private retryConnection(url: string) {
    setTimeout(() => {
      this.logger.log('--- start retry connection ---')
      this.initClient(url)
    }, 10000)
  }
}
