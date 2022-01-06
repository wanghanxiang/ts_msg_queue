//import amqp = require('amqplib');
import amqp, { Connection } from 'amqplib'
import getConfig from "../config";

interface IRabbitMQParams {
    hostname: string
    protocol: 'amqp' | 'amqps'
    port: number
    username?: string
    password?: string,
    maximumConnectionAttempts: number
    connectionRetryInterval: number
}

let mqconnect: amqp.Connection;

/**
 * 初始化配置, 地址和端口
 */
//const rabbitConfig = getConfig().rabbitmq;


function sleep(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout))
}

export async function createRabbitMqConnection({ hostname, port, username, password, protocol, maximumConnectionAttempts, connectionRetryInterval }: IRabbitMQParams, attempsMade: number = 1): Promise<Connection> {
    try {
        if (attempsMade > 1) await sleep(attempsMade * connectionRetryInterval);

        mqconnect = await amqp.connect({ protocol, hostname, password, port, username })
        console.log('MQTT Connected');
        return mqconnect;
    } catch (err) {
        if (attempsMade >= maximumConnectionAttempts + 1) throw new Error("rabbitmq链接失败");
        console.log(`Failed to connect to MQTT (${attempsMade}/${maximumConnectionAttempts}) "${err}" trying in ${(attempsMade * connectionRetryInterval) / 1000}s`)
        return createRabbitMqConnection({ hostname, port, username, password, protocol, maximumConnectionAttempts, connectionRetryInterval }, attempsMade + 1);
    }
}


export {
    mqconnect
}