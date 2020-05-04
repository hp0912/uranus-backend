import { Service } from "typedi";
import { UserEntity } from "../common/schema/UserEntity";
import BaseModel from './BaseModel';

@Service()
export default class UserModel extends BaseModel<UserEntity> {
  getName() {
    return 'user';
  }

  getModelForClass() {
    const modelForClass = new UserEntity().getModelForClass(UserEntity, {
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
