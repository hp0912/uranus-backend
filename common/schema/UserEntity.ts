import { index, prop } from '@typegoose/typegoose';

@index({ username: 1 }, { unique: true })
@index({ githubId: 1 }, { unique: false })
@index({ username: 1, githubId: 1 }, { unique: true })
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

  @prop({ required: false, default: false }) // 是否被禁言
  isBanned?: boolean;

  @prop({ required: false, default: 0 }) // 禁言到期时间
  expires?: number;

  @prop({ required: true, default: true })
  activated?: boolean;

  @prop({ required: true })
  registerTime?: number;

  @prop({ required: false })
  githubId?: number;

  @prop({ required: false })
  githubNodeId?: string;
}
