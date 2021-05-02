import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { WatermelonEntity } from "../common/schema/WatermelonEntity";
import BaseModel from './BaseModel';

@Service()
export default class WatermelonModel extends BaseModel<WatermelonEntity> {
  getName() {
    return 'watermelon';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(WatermelonEntity, {
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
