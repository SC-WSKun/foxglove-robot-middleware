import { Injectable } from '@nestjs/common';
import { Channel, FoxgloveClient, SubscriptionId } from '@foxglove/ws-protocol';
import Debug from 'debug';
import protobufjs from 'protobufjs';
import { Command } from 'commander';
import { FileDescriptorSet } from 'protobufjs/ext/descriptor';
const WebSocket = require('ws');

const log = Debug('foxglove: simple-client');
Debug.enable('foxglove:*');

@Injectable()
export class FoxgloveService {
  client: FoxgloveClient;
  channels: Map<SubscriptionId, Channel> = new Map();
  async initClient(url: string) {
    const address =
      url.startsWith('ws://') || url.startsWith('wss://') ? url : `ws://${url}`;
    log(`Client connecting to ${address}`);

    this.client = new FoxgloveClient({
      ws: new WebSocket(address, [FoxgloveClient.SUPPORTED_SUBPROTOCOL]),
    });

    const deserializers = new Map();

    this.client.on('open', () => {
      log('Connected Successfully!');
    });

    this.client.on('error', (error) => {
      log('Error', error);
      throw error;
    });

    this.client.on('advertise', (channels) => {
      for (const channel of channels) {
        if (channel.encoding === 'json') {
          const textDecoder = new TextDecoder();
          const subId = this.client.subscribe(channel.id);
          deserializers.set(subId, (data) =>
            JSON.parse(textDecoder.decode(data)),
          );
        } else if (channel.encoding === 'protobuf') {
          const root = protobufjs.Root.fromDescriptor(
            FileDescriptorSet.decode(Buffer.from(channel.schema, 'base64')),
          );

          const type = root.lookupType(channel.schemaName);

          const subId = this.client.subscribe(channel.id);

          deserializers.set(subId, (data) =>
            type.decode(
              new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
            ),
          );
        } else {
          console.warn(`Unsupported encoding ${channel.encoding}`);
        }
      }
    });

    this.client.on('message', ({ subscriptionId, timestamp, data }) => {
      console.log({
        subscriptionId,
        timestamp,
        data: deserializers.get(subscriptionId)!(data),
      });
    });
  }

  subscribeTopic(topic: string) {
    if(!this.client) {
      return Promise.reject('Client not initialized');
    }
    const channel = _.find(Array.from(this.channels.values()), { topic })
    if (!channel) {
      return Promise.reject('Channel not found')
    }

    const subId = state.client.subscribe(channel.id)

    state.subs.push({
      subId,
      channelId: channel.id
    })
    return Promise.resolve(subId)
  }
}
