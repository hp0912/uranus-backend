import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { TokenEntity } from "../common/schema/TokenEntity";
import BaseModel from './BaseModel';

@Service()
export default class TokenModel extends BaseModel<TokenEntity> {
  getName() {
    return 'token';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(TokenEntity, {
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
