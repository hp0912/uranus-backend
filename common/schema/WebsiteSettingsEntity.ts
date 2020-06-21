import { prop } from '@typegoose/typegoose';

export class WebsiteSettingsEntity {
  _id?: string;

  id?: string;

  @prop({ required: true })
  motto?: string;

  @prop({ required: true })
  advertisement?: string;

  @prop({ required: true }) // 是否开启评论审核
  commentReview?: boolean;

  @prop({ required: true }) // 是否开启留言审核
  messageReview?: boolean;
}
