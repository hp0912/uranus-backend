import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { OrderEntity } from "../common/schema/OrderEntity";
import BaseModel from './BaseModel';

@Service()
export default class OrderModel extends BaseModel<OrderEntity> {
  getName() {
    return 'order';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(OrderEntity, {
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
