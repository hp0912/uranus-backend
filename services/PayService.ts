import axios from 'axios';
import crypto from 'crypto';
import { Inject, Service } from 'typedi';
import { GoodsType, OrderCode, OrderEntity } from '../common/schema/OrderEntity';
import { PayCode, PayMethod, PayType } from '../common/schema/PayEntity';
import {
  ICashierPayData,
  IPayData,
  IPayNotifyRequest,
  IPayResponse,
  IRefundResponse,
  IScanPayResponse,
  IWAPPayData,
  IWAPPayResponse,
  PayReturnCode,
} from '../common/types/commom';
import config from '../config';
import OrderModel from '../models/OrderModel';
import PayModel from '../models/PayModel';
import { guid } from '../utils';

const payDomain = 'https://houhoukang.com';
const scanURL = 'https://admin.xunhuweb.com/pay/payment';
const WAPURL = 'https://admin.xunhuweb.com/pay/payment';
const refundURL = 'https://admin.xunhuweb.com/pay/refund';

@Service()
export default class PayService {
  @Inject()
  private orderModel: OrderModel;
  @Inject()
  private payModel: PayModel;

  async initScanPay(data: { orderId: string, payType: PayType }): Promise<IScanPayResponse> {
    const { orderId, payType } = data;
    const order = await this.orderValid(orderId, payType);
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

    return await this.scan(payData, order);
  }

  async initWAPPay(data: { orderId: string, payType: PayType }): Promise<IWAPPayResponse> {
    const { orderId, payType } = data;
    const order = await this.orderValid(orderId, payType);
    const nonceStr = guid().replace('-', '');
    const WPAURL = this.getRedirectURL(order);

    const payData: IWAPPayData = {
      mchid: config.merchantID,
      out_trade_no: orderId,
      total_fee: order.totalPrice,
      body: order.remark,
      notify_url: config.notifyUrl,
      type: PayType.WeChatPay,
      nonce_str: nonceStr,
      sign: '',
      trade_type: 'WAP',
      wap_url: WPAURL,
      wap_name: '吼吼',
    };

    return await this.wap(payData, order);
  }

  async initCashierPay(data: { orderId: string, payType: PayType }): Promise<ICashierPayData> {
    const { orderId, payType } = data;
    const order = await this.orderValid(orderId, payType);
    const nonceStr = guid().replace('-', '');
    const redirectURL = this.getRedirectURL(order);

    const payData: ICashierPayData = {
      mchid: config.merchantID,
      out_trade_no: orderId,
      total_fee: order.totalPrice,
      body: order.remark,
      notify_url: config.notifyUrl,
      type: payType,
      nonce_str: nonceStr,
      sign: '',
      redirect_url: redirectURL,
    };

    return await this.cashier(payData, order);
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
    console.log(`交易回调起始 ->`);
    console.log(JSON.stringify(data, null, 2));

    if (vSign !== sign) {
      console.error(`交易回调通知: ${out_trade_no}签名验证失败.`);
      return false;
    }

    const pay = await this.payModel.findOne({ orderId: out_trade_no });

    if (!pay) {
      console.error(`${new Date().toISOString()}: 不存在的订单[${out_trade_no}]`);
      return false;
    }

    const isRefund = !!pay.refund_no;

    if (!isRefund) {
      if (return_code.toLowerCase() !== PayReturnCode.success || status !== 'complete') {
        console.error(`交易回调通知: ${out_trade_no}服务商返回支付失败, 错误: ${err_msg}`);
        await Promise.all([
          this.orderModel.findOneAndUpdate({ _id: out_trade_no }, { code: OrderCode.failure, status: err_msg }),
          this.payModel.findOneAndUpdate({ orderId: out_trade_no }, { code: PayCode.failure, status: err_msg, transaction_id, third_party_order_id: order_id }),
        ]);
        return true;
      }

      await Promise.all([
        this.orderModel.findOneAndUpdate({ _id: out_trade_no }, { code: OrderCode.success, status: '支付成功' }),
        this.payModel.findOneAndUpdate({ orderId: out_trade_no }, { code: PayCode.success, status: '支付成功', transaction_id, third_party_order_id: order_id }),
      ]);

      console.log(`交易回调支付通知结束, 订单号: ${out_trade_no}支付成功. 服务商返回信息: ${data.return_msg}, 返回状态: ${data.status}`);
      return true;
    } else {
      if (return_code.toLowerCase() !== PayReturnCode.success) {
        console.error(`交易回调通知: ${out_trade_no}服务商返回退款失败, 错误: ${err_msg}`);
        await Promise.all([
          this.orderModel.findOneAndUpdate({ _id: out_trade_no }, { code: OrderCode.refund_fail, status: err_msg }),
          this.payModel.findOneAndUpdate({ orderId: out_trade_no }, { code: PayCode.refund_fail, status: err_msg }),
        ]);
        return true;
      }

      await Promise.all([
        this.orderModel.findOneAndUpdate({ _id: out_trade_no }, { code: OrderCode.refunded, status: '退款成功' }),
        this.payModel.findOneAndUpdate({ orderId: out_trade_no }, { code: PayCode.refunded, status: '退款成功' }),
      ]);

      console.log(`交易回调退款通知结束, 订单号: ${out_trade_no}退款成功. 服务商返回信息: ${data.return_msg}, 返回状态: ${data.status}`);
      return true;
    }
  }

  async refund(orderId: string): Promise<void> {
    const pay = await this.payModel.findOne({ orderId });

    if (!pay) {
      throw new Error('未找到该订单支付记录');
    }

    const nonceStr = guid().replace('-', '');
    const refundParams = {
      mchid: config.merchantID,
      order_id: pay.third_party_order_id,
      out_trade_no: orderId,
      refund_desc: '其他',
      notify_url: config.notifyUrl,
      nonce_str: nonceStr,
      sign: '',
    };

    const sign = this.sign(refundParams);
    refundParams.sign = sign;

    const refundResponse = await axios({
      method: 'POST',
      url: refundURL,
      data: refundParams,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const refundResult: IRefundResponse = refundResponse.data;
    console.log(`${refundResult.out_trade_no}发起退款${refundResult.return_code}～`);

    if (refundResult.return_code.toLowerCase() !== PayReturnCode.success) {
      throw new Error(refundResult.err_msg);
    }

    const refundResultSign = refundResult.sign;
    const sign2 = this.sign(refundResult);

    if (refundResultSign !== sign2) {
      throw new Error('非法的签名');
    }

    await Promise.all([
      this.payModel.findOneAndUpdate({ orderId }, { refund_no: refundResult.refund_no, code: PayCode.refunding }),
      this.orderModel.findOneAndUpdate({ _id: orderId }, { code: OrderCode.refunding }),
    ]);
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
    await this.generatePay(PayMethod.scan, data, order, scanResult);

    return scanResult;
  }

  private async wap(data: IWAPPayData, order: OrderEntity): Promise<IWAPPayResponse> {
    const sign = this.sign(data);
    data.sign = sign;

    const scanResponse = await axios({
      method: 'POST',
      url: WAPURL,
      data,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const scanResult: IWAPPayResponse = scanResponse.data;
    await this.generatePay(PayMethod.wap, data, order, scanResult);

    return scanResult;
  }

  private async cashier(data: ICashierPayData, order: OrderEntity): Promise<ICashierPayData> {
    const sign = this.sign(data);
    data.sign = sign;

    await this.generatePay(PayMethod.cashier, data, order);

    return data;
  }

  private async generatePay(payMethod: PayMethod, data: IPayData, order: OrderEntity, payResponse?: IPayResponse): Promise<void> {
    if (payResponse) {
      if (payResponse.return_code.toLowerCase() !== PayReturnCode.success) {
        throw new Error(payResponse.err_msg);
      }

      const scanResultSign = payResponse.sign;
      const sign2 = this.sign(payResponse);

      if (scanResultSign !== sign2) {
        throw new Error('非法的签名');
      }
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
        method: payMethod,
        transaction_id: '',
        third_party_order_id: '',
        createTime: Date.now(),
      });
    } else {
      throw new Error('重复的订单号，请重新发起支付');
    }
  }

  private getRedirectURL(order: OrderEntity): string {
    let redirectURL = '';

    switch (order.goodsType) {
      case GoodsType.article:
        redirectURL = `${payDomain}/article/detail/${order.goodsId}`;
        break;
      default:
        throw new Error('订单参数异常');
    }

    return redirectURL;
  }

  private async orderValid(orderId: string, payType: PayType): Promise<OrderEntity> {
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

    return order;
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