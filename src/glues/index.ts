import { createRabbitMqConnection } from "./rabbitMq";
import { createRedisConnection } from "./redis";
import getConfig from "../config";

const rabbitConfig = getConfig().rabbitmq;

export default function createConnection() {
  return Promise.all([
    createRedisConnection().then(() => console.log("redis已连接")),
    //createRabbitMqConnection(rabbitConfig).then(() => console.log("rabbitmq已连接"))
  ]).catch(err => {
    console.error(`连接失败: ${err.message}`);
    return Promise.reject(err);
  });
}

