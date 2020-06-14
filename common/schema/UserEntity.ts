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

  @prop({ required: false, default: 'https://img.houhoukang.com/uranus/system/default-avatar.png' })
  avatar?: string;

  @prop({ required: false, default: 1 }) // 普通会员1，管理员6，系统管理员10
  accessLevel?: number;

  @prop({ required: false })
  lastLoginTime?: number;

  @prop({ required: false })
  signature?: string;

  @prop({ required: false })
  personalProfile?: string;

  @prop({ required: true, default: true })
  activated?: boolean;
}
