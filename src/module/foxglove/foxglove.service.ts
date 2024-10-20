import { Injectable } from '@nestjs/common'
import {
  Channel,
  ClientChannelWithoutId,
  FoxgloveClient,
  SubscriptionId,
} from '@foxglove/ws-protocol'
import { parse as parseMessageDefinition } from '@foxglove/rosmsg'
import Debug from 'debug'
import { find } from 'lodash'
import { MessageWriter } from '@foxglove/rosmsg2-serialization'
const WebSocket = require('ws')

const log = Debug('foxglove: simple-client')
Debug.enable('foxglove:*')

@Injectable()
export class FoxgloveService {
  client: FoxgloveClient
  subChannels: Map<SubscriptionId, Channel> = new Map() // Map of channels from server advertise
  pubChannels: Map<string, ClientChannelWithoutId & { id: number }> = new Map() // Map of channels from server advertise
  subs: Map<string, { subId: number; channelId: number }> = new Map()
  callbacks: { [key: number]: (timestamp: bigint, data: any) => void } = {} // Array of subscriptions
  async initClient(url: string) {
    const address =
      url.startsWith('ws://') || url.startsWith('wss://') ? url : `ws://${url}`
    log(`Client connecting to ${address}`)

    this.client = new FoxgloveClient({
      ws: new WebSocket(address, [FoxgloveClient.SUPPORTED_SUBPROTOCOL]),
    })

    this.client.on('open', () => {
      log('Connected Successfully!')
    })

    this.client.on('close', () => {
      log('Connection closed')
    })

    this.client.on('error', error => {
      log('Error', error)
      throw error
    })

    this.client.on('advertise', channels => {
      for (const channel of channels) {
        this.subChannels.set(channel.id, channel)
      }
      console.log('server channels number:', this.subChannels.size)
    })

    this.client.on('message', ({ subscriptionId, timestamp, data }) => {
      if (this.callbacks[subscriptionId]) {
        log('Received message:', subscriptionId, timestamp, data)
        this.callbacks[subscriptionId](timestamp, data)
      } else {
        log('No callback for subscriptionId:', subscriptionId)
      }
    })
  }

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
    if (!this.client) {
      return Promise.reject('Client not initialized')
    }
    const channelId = this.client.advertise(channel)
    this.pubChannels.set(channel.topic, { ...channel, id: channelId })
    return Promise.resolve(channel.topic)
  }

  publishMessage(topic: string, message: any) {
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
    this.client.sendMessage(channel.id, uint8Array)
  }

  addHandler(topic: string, callback: (...args: any) => void) {
    if (!this.client) {
      log('foxglove client is not initialized')
      return
    }
    const channel = this.subs.get(topic)
    if (!channel) {
      log('Channel not found:', topic)
      return
    }
    if (this.callbacks[channel.subId]) {
      log('Callback is already exist: ', topic)
      return
    }
    this.callbacks[channel.subId] = callback
  }
}
