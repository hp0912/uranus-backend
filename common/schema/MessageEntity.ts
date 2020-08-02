import { index, prop } from '@typegoose/typegoose';

@index({ userId: 1 }, { unique: false })
@index({ addtime: 1 }, { unique: false })
export class MessageEntity {
  _id?: string;

  id?: string;

  @prop({ required: false })
  userId?: string;

  @prop({ required: false })
  userNicname?: string;

  @prop({ required: false })
  userAvatar?: string;

  @prop({ required: false })
  userAccessLevel?: number;

  @prop({ required: true })
  content?: string;

  @prop({ required: true })
  addtime?: number;
}