
import msgClient from '../helper/rabbitHelper';


export class ApiService {

    //测试请求testmq接口
    public async testmq(data: any) {
        console.info(`data${data}`)
        return await msgClient.postMessage(data);
    }

    //测试请求广播消息接口
    public async testBroadmq(data: any) {
        console.info(`data${data}`)
        return await msgClient.postBroadcastMessage(data);
    }


}