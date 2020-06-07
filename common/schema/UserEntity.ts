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

  @prop({ required: false, default: 'https://tva1.sinaimg.cn/crop.4.2.138.138.180/9962f669jw1e71ugtrulyj2043044mxa.jpg?KID=imgbed,tva&Expires=1591533057&ssig=C1pnaQITLP' })
  avatar?: string;

  @prop({ required: false, default: 1 }) // 普通会员1，管理员6，系统管理员10
  accessLevel?: number;

  @prop({ required: false })
  lastLoginTime?: number;
}
