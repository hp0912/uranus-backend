import { index, prop } from '@typegoose/typegoose';

@index({ lock_key: 1 }, { unique: true })
export class DistributedLockEntity {
  _id?: string;

  @prop({ required: true })
  lock_key: string;

  @prop()
  desc?: string;

  @prop()
  expired_time: number;
}