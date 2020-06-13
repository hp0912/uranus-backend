import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { TagEntity } from "../common/schema/TagEntity";
import BaseModel from './BaseModel';

@Service()
export default class TagModel extends BaseModel<TagEntity> {
  getName() {
    return 'tag';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(TagEntity, {
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
