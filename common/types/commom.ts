import { CommentEntity } from '../schema/CommentEntity';
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
  isBanned?: boolean;
  expires?: number;
  activated?: boolean;
  registerTime?: number;
}

export interface IPayData {
  mchid: string; // 平台分配商户号
  out_trade_no: string; // 用户端自主生成的订单号
  total_fee: number; // 单位：分
  body: string; // 商品描述
  notify_url: string; // 通知回调地址
  type: PayType;
  goods_detail?: string; // 商品详情
  attach?: string; // 附加的其他参数
  nonce_str: string; // 随机字符串 增加安全性
  sign: string; // 签名
}

export enum PayReturnCode {
  success = 'success',
  fail = 'fail',
}

export interface IPayResponse {
  return_code: PayReturnCode;
  return_msg?: string;
  err_code?: string;
  err_msg?: string;
  nonce_str: string;
  sign: string;
  goods_detail?: string;
  mchid: string;
  order_id: string;
  out_trade_no: string;
  total_fee: string;
  code_url: string;
}

export interface IScanPayResponse extends IPayResponse {
  code_url: string;
}

export interface IPayNotifyRequest {
  return_code: string;
  return_msg?: string;
  err_code?: string;
  err_msg?: string;
  nonce_str: string;
  sign: string;
  mchid: string;
  order_id: string; // 平台返回订单号
  transaction_id: string; // 微信支付宝等第三方平台交易号
  out_trade_no: string; // 用户端自主生成的订单号
  total_fee: number;
  status: 'complete';
  time_end: string;
  attach?: string;
}

export interface ICommentEntity extends CommentEntity {
  children?: CommentEntity[];
}

export enum ThirdParty {
  github = 'github',
}