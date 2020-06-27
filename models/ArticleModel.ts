import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { ArticleEntity } from "../common/schema/ArticleEntity";
import BaseModel from './BaseModel';

@Service()
export default class ArticleModel extends BaseModel<ArticleEntity> {
  getName() {
    return 'article';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(ArticleEntity, {
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
