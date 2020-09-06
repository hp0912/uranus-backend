import { index, prop } from '@typegoose/typegoose';

export enum PayCode {
  init = 0,
  success = 200,
  failure = 500,
  refund = 204,
}

export enum PayType {
  AliPay = 'alipay',
  WeChatPay = 'wechat',
}

export enum PayMethod {
  scan = 'scan',
  wap = 'wap',
  cashier = 'cashier',
}

@index({ orderId: 1 }, { unique: true })
export class PayEntity {
  _id?: string;

  id?: string;

  @prop({ required: true })
  orderId?: string;

  @prop({ required: true })
  userId?: string;

  @prop({ required: true }) // 金额以分为单位
  amount?: number;

  @prop({ required: true, enum: PayCode }) // 支付状态码
  code?: PayCode;

  @prop({ required: true }) // 支付状态: 未支付和已支付
  status?: string;

  @prop({ required: true, enum: PayType }) // 支付渠道
  payType?: PayType;

  @prop({ required: true, enum: PayMethod }) // 支付方式: 扫码或者调起APP
  method?: PayMethod;

  @prop({ required: false })
  third_party_order_id?: string;

  @prop({ required: false })
  transaction_id?: string;

  @prop({ required: false }) // 退款单号
  refund_no?: string;

  @prop({ required: true })
  createTime?: number;
}
