import { index, prop } from '@typegoose/typegoose';

@index({ username: 1 }, { unique: true })
export class UserEntity {
  _id?: string;

  id?: string;

  @prop({ required: true })
  username?: string;

  @prop({ required: false })
  nickname?: string;

  @prop({ required: true })
  password?: string;

  @prop({ required: false })
  lastAction?: number;
}
