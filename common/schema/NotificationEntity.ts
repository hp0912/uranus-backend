import { index, prop } from '@typegoose/typegoose';

@index({ userId: 1 }, { unique: false })
@index({ time: 1 }, { unique: false })
export class NotificationEntity {
  _id?: string;

  id?: string;

  @prop({ required: true })
  title?: string;

  @prop({ required: false })
  desc?: string;

  @prop({ required: false })
  content?: string;

  @prop({ required: false })
  userId?: string;

  @prop({ required: true })
  time?: number;

  @prop({ required: true })
  hasRead?: boolean;
}
