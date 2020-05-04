import { plugin, prop, Typegoose } from '@hasezoey/typegoose';
import autoIncrement from "mongoose-auto-increment";

@plugin(autoIncrement.plugin, {
  model: 'user',
  startAt: 1,
  incrementBy: 5,
})
export class UserEntity extends Typegoose {
  @prop({ required: true })
  id?: number;

  @prop({ required: true })
  username?: string;

  @prop({ required: true })
  passsalt?: string;
}
