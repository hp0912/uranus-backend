import { index, prop } from '@typegoose/typegoose';

@index({ name: 1 }, { unique: true })
export class TagEntity {
  _id?: string;

  id?: string;

  @prop({ required: true })
  name?: string;

  @prop({ required: false })
  color?: string;

  @prop({ required: false, default: 0 })
  index?: number;

  @prop({ required: false })
  addTime?: number;

  @prop({ required: false })
  addBy?: string;

  @prop({ required: false })
  updateTime?: number;

  @prop({ required: false })
  updateBy?: string;
}
