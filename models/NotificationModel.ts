import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { NotificationEntity } from "../common/schema/NotificationEntity";
import BaseModel from './BaseModel';

@Service()
export default class NotificationModel extends BaseModel<NotificationEntity> {
  getName() {
    return 'notification';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(NotificationEntity, {
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
