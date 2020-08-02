import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { MessageEntity } from "../common/schema/MessageEntity";
import BaseModel from './BaseModel';

@Service()
export default class MessageModel extends BaseModel<MessageEntity> {
  getName() {
    return 'message';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(MessageEntity, {
      schemaOptions: {
        collection: this.getName(),
        toObject: {
          getters: true,
          transform: (doc: any, ret: any, options: any) => {
            delete ret._id;
            return ret;
          },
        },
      },
    });
    return modelForClass;
  }
}
