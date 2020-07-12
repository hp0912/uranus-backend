import { Inject, Service } from 'typedi';
import { PayCode, PayMethod, PayType } from '../common/schema/PayEntity';
import { IPayData, IUser } from '../common/types/commom';
import config from '../config';
import OrderModel from '../models/OrderModel';
import PayModel from '../models/PayModel';

@Service()
export default class PayService {
  @Inject()
  private orderModel: OrderModel;
  @Inject()
  private payModel: PayModel;

  async initPay(data: { orderId: string, payType: PayType, payMethod: PayMethod }, user: IUser): Promise<IPayData> {
    const { orderId, payType, payMethod } = data;

    if (!orderId) {
      throw new Error('无效的参数');
    }

    const order = await this.orderModel.findOne({ _id: orderId });

    if (!order) {
      throw new Error('订单不存在');
    }

    const pay = await this.payModel.findOne({ orderId });

    if (pay && pay.code === PayCode.success) {
      throw new Error('订单已支付');
    }

    // 重新初始化支付订单
    if (pay) {
      await this.payModel.deleteOne({ orderId });
    }

    const payData = {
      amount: '10',
      tradeName: '吼吼订单支付', // 商户自定义订单标题
      outTradeNo: orderId, // 商户自主生成的订单号
      payType, // 支付渠道
      payuserid: user.id, // 商家支付id
      notifyUrl: config.notifyUrl, // 服务器异步通知
      appkey: config.trPayappkey,
      method: payMethod === PayMethod.scan ? 'trpay.trade.create.scan' : 'trpay.trade.create.wap',
      timestamp: new Date().getTime() + '',
      version: '1.0'
    };

    return payData;
  }
}