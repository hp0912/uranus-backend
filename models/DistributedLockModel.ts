import { getModelForClass } from '@typegoose/typegoose';
import { Service } from "typedi";
import { DistributedLockEntity } from "../common/schema/DistributedLockEntity";
import BaseModel from './BaseModel';

@Service()
export default class DistributedLockModel extends BaseModel<DistributedLockEntity> {
  getName() {
    return 'distributed_lock';
  }

  getModelForClass() {
    const modelForClass = getModelForClass(DistributedLockEntity, {
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

  lock = async (key: string, timeout: number = 6000): Promise<boolean> => {
    const now = Date.now();

    await this.model.deleteOne({
      lock_key: key,
      expired_time: { $lt: now },
    });

    while (true) {

      if (Date.now() - now > timeout) {
        break;
      }

      try {
        const mdl = new this.model({
          lock_key: key,
          desc: '',
          expired_time: Date.now() + timeout,
        });

        await mdl.save();

        return true;
      } catch (ex) {
        await new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            resolve();
          }, 1000);
        });
      }
    }

    return false;
  }

  unlock = async (key: string): Promise<void> => {
    await this.model.deleteOne({
      lock_key: key,
    });
  }
}
