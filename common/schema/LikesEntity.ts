import { index, prop } from '@typegoose/typegoose';

export enum LikesType {
  article = 'article',
}

@index({ likesType: 1, targetId: 1 }, { unique: false })
@index({ likesType: 1, targetId: 1, userId: 1 }, { unique: true })
@index({ userId: 1 }, { unique: false })
export class LikesEntity {
  _id?: string;

  id?: string;

  @prop({ required: true, enum: LikesType })
  likesType?: LikesType;

  @prop({ required: true }) // 文章或其他板块
  targetId?: string;

  @prop({ required: true }) // 点赞的人
  userId?: string;

  @prop({ required: true }) // 点赞时间
  addtime?: number;
}