import axios from 'axios';
import crypto from 'crypto';
import { Inject, Service } from 'typedi';
import { OrderCode, OrderEntity } from '../common/schema/OrderEntity';
import { PayCode, PayMethod, PayType } from '../common/schema/PayEntity';
import { IPayData, IPayNotifyRequest, IScanPayResponse, IUser, PayReturnCode } from '../common/types/commom';
import config from '../config';
import OrderModel from '../models/OrderModel';
import PayModel from '../models/PayModel';
import { guid } from '../utils';

const scanURL = 'https://admin.xunhuweb.com/pay/payment';

@Service()
export default class PayService {
  @Inject()
  private orderModel: OrderModel;
  @Inject()
  private payModel: PayModel;

  async initPay(data: { orderId: string, payType: PayType, payMethod: PayMethod }, user: IUser): Promise<IScanPayResponse> {
    const { orderId, payType, payMethod } = data;
    const now = Date.now();

    if (!orderId) {
      throw new Error('无效的参数');
    }

    if (payType !== PayType.AliPay && payType !== PayType.WeChatPay) {
      throw new Error('无效的参数');
    }

    const order = await this.orderModel.findOne({ _id: orderId });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (now - order.createTime > 15 * 60 * 1000) {
      throw new Error('订单已过期');
    }

    const pay = await this.payModel.findOne({ orderId });

    if (pay && pay.code === PayCode.success) {
      throw new Error('订单已支付');
    }

    const nonceStr = guid().replace('-', '');
    const payData: IPayData = {
      mchid: config.merchantID,
      out_trade_no: orderId,
      total_fee: order.totalPrice,
      body: order.remark,
      notify_url: config.notifyUrl,
      type: payType,
      nonce_str: nonceStr,
      sign: '',
    };

    if (payMethod === PayMethod.scan) {
      return await this.scan(payData, order);
    }
  }

  async queryStatus(orderId: string): Promise<{ code: PayCode, status: string }> {
    const pay = await this.payModel.findOne({ orderId });

    if (!pay) {
      throw new Error('订单不存在');
    }

    return { code: pay.code, status: pay.status };
  }

  async notify(data: IPayNotifyRequest): Promise<boolean> {
    const { sign, return_code, status, transaction_id, out_trade_no, order_id, err_msg } = data;
    const vSign = this.sign(data);

    if (vSign !== sign) {
      return false;
    }

    if (return_code !== PayReturnCode.success || status !== 'complete') {
      await Promise.all([
        this.orderModel.findOneAndUpdate({ _id: out_trade_no }, { code: OrderCode.failure, status: err_msg }),
        this.payModel.findOneAndUpdate({ orderId: out_trade_no }, { code: PayCode.failure, status: err_msg, transaction_id, third_party_order_id: order_id }, { upsert: true }),
      ]);
      return false;
    }

    await Promise.all([
      this.orderModel.findOneAndUpdate({ _id: out_trade_no }, { code: OrderCode.success, status: '支付成功' }),
      this.payModel.findOneAndUpdate({ orderId: out_trade_no }, { code: PayCode.success, status: '支付成功', transaction_id, third_party_order_id: order_id }, { upsert: true }),
    ]);

    return true;
  }

  private async scan(data: IPayData, order: OrderEntity): Promise<IScanPayResponse> {
    const sign = this.sign(data);
    data.sign = sign;

    const scanResponse = await axios({
      method: 'POST',
      url: scanURL,
      data,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const scanResult: IScanPayResponse = scanResponse.data;

    if (scanResult.return_code.toLowerCase() !== PayReturnCode.success) {
      throw new Error(scanResult.err_msg);
    }

    const scanResultSign = scanResult.sign;
    const sign2 = this.sign(scanResult);

    if (scanResultSign !== sign2) {
      throw new Error('非法的签名');
    }

    const orderIsExist = await this.payModel.findOne({ orderId: data.out_trade_no });

    if (!orderIsExist) {
      await this.payModel.save({
        orderId: data.out_trade_no,
        userId: order.buyerId,
        amount: data.total_fee,
        code: PayCode.init,
        status: '订单初始化',
        payType: data.type,
        method: PayMethod.scan,
        transaction_id: '',
        third_party_order_id: '',
        createTime: Date.now(),
      });
    }

    return scanResult;
  }

  private sign<T extends { sign: string }>(data: T): string {
    delete data.sign;
    const keys = Object.keys(data);
    keys.sort();

    const signStrArr = [];
    keys.forEach(key => {
      if (data[key] !== '') {
        signStrArr.push(`${key}=${data[key]}`);
      }
    });

    signStrArr.push(`key=${config.merchantSecret}`);

    return crypto.createHash('md5').update(signStrArr.join('&')).digest("hex").toUpperCase();
  }
}