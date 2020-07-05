import { PayType } from '../schema/PayEntity';

export interface IHttpResult<T> {
  code: number;
  message: string;
  data: T | null;
}

export interface IUser {
  id?: string;
  username: string;
  nickname: string;
  avatar: string;
  accessLevel: number;
  signature?: string;
  personalProfile?: string;
  activated?: boolean;
  registerTime?: number;
}

export interface IPayData {
  amount: string; // 免单,最低支付1分
  tradeName: string; // 商户自定义订单标题
  outTradeNo: string; // 商户自主生成的订单号
  payType: PayType; // 支付渠道
  payuserid: string; // 商家支付id
  notifyUrl: string; // 服务器异步通知
  appkey: string;
  method: string;
  timestamp: string;
  version: string;
}