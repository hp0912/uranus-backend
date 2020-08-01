import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { LikesEntity } from "../common/schema/LikesEntity";
import BaseModel from './BaseModel';

@Service()
export default class LikesModel extends BaseModel<LikesEntity> {
  getName() {
    return 'likes';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(LikesEntity, {
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
