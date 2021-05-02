import { index, prop } from '@typegoose/typegoose';
import { PayCode } from './PayEntity';

@index({ userId: 1, path: 1 }, { unique: true })
@index({ path: 1 }, { unique: true })
@index({ userId: 1 }, { unique: false })
export class WatermelonEntity {
  _id?: string;

  id?: string;

  @prop({ required: true })
  userId?: string;

  @prop({ required: true })
  path?: string;

  @prop({ required: true, default: 0 })
  amount?: number;

  @prop({ required: true, enum: PayCode }) // 支付状态码
  code?: PayCode;

  @prop({ required: true, default: false }) // 拷贝文件失败
  init_failed?: boolean;

  @prop({ required: true })
  addtime?: number;
}