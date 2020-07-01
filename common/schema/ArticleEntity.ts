import { index, prop } from '@typegoose/typegoose';

export enum ShareWith {
  private = 'private',
  public = 'public',
}

export enum AuditStatus {
  approved = 'approved',
  unapprove = 'unapprove',
}

@index({ title: 1 }, { unique: true })
@index({ createdBy: 1 }, { unique: false })
@index({ modifyBy: 1 }, { unique: false })
export class ArticleEntity {
  _id?: string;

  id?: string;

  @prop({ required: true })
  title?: string;

  @prop({ required: false, default: "https://img.houhoukang.com/uranus/system/default-cover.jpg" })
  coverPicture?: string;

  @prop({ required: false, type: String })
  tags?: string[];

  @prop({ required: false })
  desc?: string;

  @prop({ required: true })
  content?: string;

  @prop({ required: true, default: false })
  charge?: boolean;

  @prop({ required: true, default: 0 })
  amount?: number;

  @prop({ required: true, enum: ShareWith })
  shareWith?: ShareWith;

  @prop({ required: false, enum: AuditStatus, default: AuditStatus.unapprove })
  auditStatus?: AuditStatus;

  @prop({ required: true })
  createdBy?: string;

  @prop({ required: true })
  createdTime?: number;

  @prop({ required: true })
  modifyBy?: string;

  @prop({ required: true })
  modifyTime?: number;
}
