import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { PayEntity } from "../common/schema/PayEntity";
import BaseModel from './BaseModel';

@Service()
export default class PayModel extends BaseModel<PayEntity> {
  getName() {
    return 'pay';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(PayEntity, {
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
