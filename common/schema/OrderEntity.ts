import { index, prop } from '@typegoose/typegoose';

export enum GoodsType {
  article = 'article',
  watermelon = 'watermelon',
}

export enum OrderCode {
  init = 0,
  success = 200,
  failure = 500,
  refunding = 201,
  refunded = 202,
  refund_fail = 204,
}

@index({ goodsType: 1, goodsId: 1, buyerId: 1 }, { unique: false })
export class OrderEntity {
  _id?: string;

  id?: string;

  @prop({ required: true, enum: GoodsType }) // 商品类别
  goodsType?: GoodsType;

  @prop({ required: true })
  goodsId?: string;

  @prop({ required: true })
  totalPrice?: number;

  @prop({ required: true })
  sellerId?: string;

  @prop({ required: true })
  buyerId?: string;

  @prop({ required: false }) // 备注
  remark?: string;

  @prop({ required: true, enum: OrderCode }) // 支付状态码
  code?: OrderCode;

  @prop({ required: false })
  status?: string;

  @prop({ required: false, default: false }) // 结算
  settled?: boolean;

  @prop({ required: true })
  createTime: number;
}
