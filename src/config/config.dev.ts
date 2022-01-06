export default {
    redis: {
        port: 6379,
        host: "127.0.0.1",
        db: 0 //可以删除掉哦
    },
    rabbitmq: {
        hostname: "localhost",
        protocol: 'amqp',
        port: 5672,
        username: "admin",
        password: "admin",
        queueName: "test",
        maximumConnectionAttempts: 2,
        connectionRetryInterval: 10,
        noAck: false
    }
};