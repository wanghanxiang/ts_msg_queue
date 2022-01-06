# ts_msg_queue

A project to learn about message queues



## 一、rabbitmq

1.1 RabbitMQ Instance with Docker

step 1)

```javascript
docker pull rabbitmq:management
```

Step2)

```javascript
docker images
```

Step3)

```javascript
docker run -d -p 15672:15672  -p  5672:5672  -e RABBITMQ_DEFAULT_USER=admin -e RABBITMQ_DEFAULT_PASS=admin --name rabbitmq --hostname=rabbitmqhostone  rabbitmq:management
```

- -d 后台运行
- -p 隐射端口
- –name 指定rabbitMQ名称
- RABBITMQ_DEFAULT_USER 指定用户账号
- RABBITMQ_DEFAULT_PASS 指定账号密码

Step4)

http://localhost:15672/#/connections

