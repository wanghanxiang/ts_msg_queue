## 一、消息队列介绍

**Kafka**：是由 Apache 软件基金会开发的一个开源流处理平台，由 Scala 和 Java 编写，是一种高吞吐量的分布式发布订阅消息系统，支持单机每秒百万并发。另外，Kafka 的定位主要在日志等方面， 因为Kafka 设计的初衷就是`处理日志`的，可以看做是一个`日志（消息）系统`一个重要组件，针对性很强。0.8 版本开始支持复制，不支持事物，因此对消息的重复、丢失、错误没有严格的要求。

**RocketMQ**：阿里开源的消息中间件，是一款低延迟、高可靠、可伸缩、易于使用的消息中间件，思路起源于 Kafka。最大的问题商业版收费，有些功能不开放。

**RabbitMQ**：由 Erlang（有着和原生 Socket 一样低的延迟）语言开发基于 AMQP 协议的开源消息队列系统。能保证消息的可靠性、稳定性、安全性。`高并发`

## 二、rabbit学习

#### 2.1Rabbitmq安装后的基本命令

以下列举一些在终端常用的操作命令

- whereis rabbitmq：查看 rabbitmq 安装位置
- rabbitmqctl start_app：启动应用
- whereis erlang：查看erlang安装位置
- rabbitmqctl start_app：启动应用
- rabbitmqctl stop_app：关闭应用
- rabbitmqctl status：节点状态
- rabbitmqctl add_user username password：添加用户
- rabbitmqctl list_users：列出所有用户
- rabbitmqctl delete_user username：删除用户
- rabbitmqctl add_vhost vhostpath：创建虚拟主机
- rabbitmqctl list_vhosts：列出所有虚拟主机
- rabbitmqctl list_queues：查看所有队列
- rabbitmqctl -p vhostpath purge_queue blue：清除队列里消息

> **注意**:以上终端所有命令,需要进入到rabbitmqctl的sbin目录下执行rabbitmqctl命令才有用，否则会报错：



2.2看这段代码前先说几个概念

- 生产者 ：生产消息的
- 消费者 ：接收消息的
- 通道 channel：建立连接后，会获取一个 channel 通道
- exchange ：交换机，消息需要先发送到 exchange 交换机，也可以说是第一步存储消息的地方(交换机会有很多类型，后面会详细说)。
- 消息队列 : 到达消费者前一刻存储消息的地方,exchange 交换机会把消息传递到此
- ack回执：收到消息后确认消息已经消费的应答

2.3 交换机类型

- **fanout** 广播
- **direct** direct 把消息路由到那些 binding key与 routing key 完全匹配的 Queue中
- **topic** 生产者指定 RoutingKey 消息根据消费端指定的队列通过模糊匹配的方式进行相应转发，两种通配符模式： #：可匹配一个或多个关键字 *：只能匹配一个关键字
- **headers** header exchange(头交换机)和主题交换机有点相似，但是不同于主题交换机的路由是基于路由键，头交换机的路由值基于消息的 header 数据。 主题交换机路由键只有是字符串,而头交换机可以是整型和哈希值 header Exchange 类型用的比较少



## 三、最后总结一下

 不管是哪一种类型的交换机，都有一个绑定binding的操作，只不过根据不同的交换机类型有不同的路由绑定策略。

  **生产者发消息的时候必须指定一个 exchange，否则消息无法直接到达消息队列，Exchange将消息路由到一个或多个Queue中（或者丢弃）**

  若不指定 exchange（为空）会默认指向 AMQP default 交换机，AMQP default 路由规则是根据 routingKey 和 mq 上有没有相同名字的队列进行匹配路由。

 如果执行交换机为广播的，对应的队列也需要binding这个交换机才可以。



延时队列：

https://juejin.cn/post/6844903839846383623

