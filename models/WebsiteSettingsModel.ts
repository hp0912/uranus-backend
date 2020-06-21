import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { WebsiteSettingsEntity } from "../common/schema/WebsiteSettingsEntity";
import BaseModel from './BaseModel';

@Service()
export default class UserModel extends BaseModel<WebsiteSettingsEntity> {
  getName() {
    return 'WebsiteSettings';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(WebsiteSettingsEntity, {
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
