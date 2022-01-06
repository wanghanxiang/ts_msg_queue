import { Connection, Channel, Replies, ConsumeMessage } from 'amqplib'
import { createRabbitMqConnection } from '../glues/rabbitMq'
import getConfig from "../config";

interface IConfig {
    hostname: string
    queueName?: string
    queueProtocol?: 'amqp' | 'amqps'
    port?: number
    username?: string
    password?: string
    maxConnectionAttemps?: number
    connectionRetryInterval?: number
    durable?: boolean
    noAck?: boolean
    persistent?: boolean//消息持久化
}

// queueHostname (required): The broker hostname, without the protocol
// queueName: Default queue to be used when posting messages, if this is null you'll have to pass the name directly to the function, defaults to undefined
// queueProtocol: amqp or amqps depending on your implementation, defaults to amqp
// queuePort: Broker port, defaults to 5672, which is rabbitMQ's default port
// username: Username in case of authentication. If not, leave it blank
// password: Password in case of authentication. If not, leave it blank
// maxConnectionAttemps: Max connection attemps that will be made in case of error on first connection, defaults to 5
// connectionRetryInternal: The interval between connection attemps (in ms), this number will be multiplied by the number of attempts made in order to create a crescent interval, defaults to 1000
// durable: Defines if a queue should be durable, defaults to true
// noAck: Defines if a consuming channel should auto acknowledge the messages it receives, defaults to false
// persistent: Defines if a message will be persistently saved, defaults to true


type LocalConfig = {
    hostname: string
    port: number
    protocol: 'amqp' | 'amqps'
    username?: string
    password?: string
    queueName?: string
    durable: boolean
    noAck: boolean
    persistent: boolean
    maxAttemps: number
    retryInterval: number
}

type MessageHandler = (message: ConsumeMessage | null) => any

/**
 * @description 
 * 
 */

export class MessageClient {

    private connection: Connection| undefined;
    private channel: Channel | undefined;//通道
    private readonly config: LocalConfig;
    private queue?: Replies.AssertQueue;
    private fanout_exchangeName = 'fanout_exchange';


    constructor() {
        const config: IConfig = getConfig().rabbitmq;
        this.config = this._makeConfig(config);
    }

    async postMessage(message: any, queueName?: string, persistent?: boolean) {
        const parsedMessage = this._parse(message)
        await this._connect();

        const queue = queueName || this.config.queueName;
        if (!queue) throw new Error('QueueName is required to send a message')

        await this._createChannel();
        await this.changeQueue(queue);
        const response = this.channel?.sendToQueue(queue, parsedMessage, { persistent: persistent || this.config.persistent })
        return response;
    }

    /**
     * @description 发送广播消息
     * @param message 
     * @param routingKey 
     * @param persistent 
     * @returns 
     */
    async postBroadcastMessage(message: any, routingKey?: string, persistent?: boolean) {
        const parsedMessage = this._parse(message)
        await this._connect();

        const _routingKey = routingKey || "";

        await this._createChannel();
        await this._assertBroadCastExchange();
        const response = this.channel?.publish(this.fanout_exchangeName, _routingKey, parsedMessage);
        return response;
    }

    async listenToQueue(queueName: string, handler: MessageHandler, noAck?: boolean, durable?: boolean) {
        await this._connect();
        await this._createChannel();
        await this.changeQueue(queueName, durable);
        await this._assertBroadCastExchange();

        //绑定关系（队列、交换机、路由键）这里是绑定广播交换机
        await this.channel?.bindQueue(queueName, this.fanout_exchangeName, "");
        return this.channel?.consume(queueName, handler, { noAck: noAck || this.config.noAck });
    }

    async changeQueue(queueName: string, durable?: boolean) {
        await this._connect();
        await this._createChannel();
        this.queue = await this.channel?.assertQueue(queueName, { autoDelete: true, durable: durable || this.config.durable })
        return this.queue;
    }

    ackMessage(message: ConsumeMessage, allUpToThis: boolean = false) {
        if (!this.channel) throw new Error('There is no channel to ack this message')
        if (this.config.noAck) throw new Error('You cannot ack a message when noAck is set to `true`')
        return this.channel.ack(message, allUpToThis);
    }

    nackMessage(message: ConsumeMessage, allUpToThis: boolean = false, requeue: boolean = true) {
        if (!this.channel) throw new Error('There is no channel to nack this message')
        if (this.config.noAck) throw new Error('You cannot nack a message when noAck is set to `true`')
        return this.channel.nack(message, allUpToThis, requeue);
    }

    rejectMessage(message: ConsumeMessage, requeue: boolean = false) {
        if (!this.channel) throw new Error('There is no channel to reject this message')
        if (this.config.noAck) throw new Error('You cannot reject a message when noAck is set to `true`')
        return this.channel.reject(message, requeue);
    }

    private _parse(message: any): Buffer {
        try {
            let value = '';
            if (typeof message === 'object') value = JSON.stringify(message);
            if (typeof message === 'number' && !isNaN(message)) value = message.toString();

            return Buffer.from(value);
        } catch (e) {
            throw new Error('Message could not be converted to Buffer: ' + e);
        }
    }

    private async _connect(): Promise<Connection> {
        if (this.connection) return this.connection;
 
        this.connection = await createRabbitMqConnection({
            hostname: this.config.hostname,
            port: this.config.port,
            username: this.config.username,
            password: this.config.password,
            protocol: this.config.protocol,
            connectionRetryInterval: this.config.retryInterval,
            maximumConnectionAttempts: this.config.maxAttemps
        });
        return this.connection;
    }

    private async _createChannel() {
        if (this.channel) return this.channel;
        this.channel = await this.connection?.createChannel();
        return this.channel
    }

    //广播交换机确认
    private async _assertBroadCastExchange() {
        await this.channel?.assertExchange(this.fanout_exchangeName, 'fanout', {
            durable: false,
        });
    }

    private onDestroy() {
        this._closeChannel();
        this._closeConnect();
    }

    private async _closeChannel() {
        if (!this.channel) return
        try {
            return this.channel.close();
        } catch { return } // Channel is already closed
    }

    private async _closeConnect() {
        if (!this.connection) return
        try {
            return this.connection.close();
        } catch { return } // connection is already closed
    }

    private _makeConfig(config: IConfig): LocalConfig {
        if (!config.hostname) throw new Error('Hostname is required');
        return {
            hostname: config.hostname,
            port: config.port || 5672,
            protocol: config.queueProtocol || 'amqp',
            username: config.username,
            password: config.password,
            queueName: config.queueName,
            durable: (config.durable === false) ? false : true,
            persistent: (config.persistent === false) ? false : true,
            maxAttemps: config.maxConnectionAttemps || 5,
            retryInterval: config.connectionRetryInterval || 1500,
            noAck: config.noAck || false
        }
    }
}

const msgClient = new MessageClient();
export default msgClient;