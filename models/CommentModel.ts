import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { CommentEntity } from "../common/schema/CommentEntity";
import BaseModel from './BaseModel';

@Service()
export default class CommentModel extends BaseModel<CommentEntity> {
  getName() {
    return 'comment';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(CommentEntity, {
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
