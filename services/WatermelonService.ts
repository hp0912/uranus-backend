import { WatermelonEntity } from "../common/schema/WatermelonEntity";
import { Inject, Service } from "typedi";
import { IUser } from "../common/types/commom";
import WatermelonModel from "../models/WatermelonModel";
import DistributedLockModel from "../models/DistributedLockModel";
import OrderModel from "../models/OrderModel";
import { PayCode } from "../common/schema/PayEntity";
import { GoodsType, OrderCode } from "../common/schema/OrderEntity";
import OSS from 'ali-oss';
import STS from '@alicloud/pop-core';
import config from '../config';
import { ISTSAuth, ISTSAuthResult } from "./STSService";

@Service()
export default class WatermelonService {
  @Inject()
  private watermelonModel: WatermelonModel;
  @Inject()
  private distributedLockModel: DistributedLockModel;
  @Inject()
  private orderModel: OrderModel;

  STSClient = new STS({
    accessKeyId: config.STSAccessKeyId,
    accessKeySecret: config.STSAccessKeySecret,
    endpoint: 'https://sts.cn-shenzhen.aliyuncs.com',
    apiVersion: '2015-04-01',
  });
  Policy = JSON.stringify(config.STSPolicy);

  async STSAuth(user: IUser, path?: string): Promise<ISTSAuthResult> {
    const policy = JSON.parse(this.Policy);

    if (path) {
      policy.Statement[0].Resource[1] = `acs:oss:*:*:uranus-lemon/${path}/*`;
    } else {
      policy.Statement[0].Resource[0] = `acs:oss:*:*:uranus-lemon`;
      policy.Statement[0].Resource[1] = `acs:oss:*:*:uranus-lemon/*`;
    }
    const Policy = JSON.stringify(policy);

    const stsToken = await this.STSClient.request<{
      RequestId: string,
      AssumedRoleUser: { Arn: string, AssumedRoleId: string },
      Credentials: ISTSAuth,
    }>('AssumeRole', {
      RoleArn: config.STSRoleArn,
      RoleSessionName: user.id,
      Policy,
    });

    return {
      ...stsToken.Credentials,
      Policy,
    };
  }

  async copyFileFromTemplate(ossClient: OSS, objects: string[], target: string) {
    if (objects && objects.length) {
      const steps = Math.ceil(objects.length / 6);
      for (let i = 0; i < steps; i++) {
        const current = objects.slice(i * 6, i * 6 + 6);
        await Promise.all(current.map(obj => {
          ossClient.copy(obj.replace(/^template/, target), obj);
        }));
      }
    }
  }

  async get(ctx, user: IUser): Promise<WatermelonEntity[]> {
    const [wres, ores] = await Promise.all([
      this.watermelonModel.find({ userId: user.id }),
      this.orderModel.find({ goodsType: GoodsType.watermelon, buyerId: user.id }),
    ]);
    for (let i = 0, resLen = wres.length; i < resLen; i++) {
      const current = wres[i];
      if (current.amount > 0 && current.code !== PayCode.success) {
        const currentOrder = ores.find(item => item.goodsId === current.id && item.code === OrderCode.success);
        if (currentOrder) {
          current.code = PayCode.success;
          await this.watermelonModel.findOneAndUpdate({ _id: current.id }, { code: PayCode.success })
        }
      }
    }
    return wres;
  }

  async add(ctx, path: string, user: IUser): Promise<WatermelonEntity[]> {
    if (path.length < 3) {
      throw new Error('游戏路径必须大于三个字符');
    }

    if (path.match(/^\d/)) {
      throw new Error('游戏路径不能以数字开头');
    }

    if (!path.match(/^[a-zA-Z0-9_-]+$/)) {
      throw new Error('游戏路径包含不合法字符');
    }

    const lock = await this.distributedLockModel.lock(user.id);

    if (lock) {
      const now = Date.now();
      const allPath = await this.watermelonModel.find({ userId: user.id });
      let amount = 0;
      let payCode: PayCode = PayCode.init;

      if (allPath.length === 0) {
        payCode = PayCode.success;
      } else if (allPath.length === 1) {
        amount = 1.99;
      } else {
        const filterPath = allPath.filter(item => item.code !== PayCode.success);
        if (filterPath.length > 0) {
          await this.distributedLockModel.unlock(user.id);
          throw new Error('您还有游戏路径未支付，请支付后再购买新路径')
        }
        amount = 5.99;
      }

      const saveRes = await this.watermelonModel.save({
        userId: user.id,
        path,
        amount,
        code: payCode,
        init_failed: false,
        addtime: now,
      });

      await this.distributedLockModel.unlock(user.id);

      const stsResult = await this.STSAuth(user);
      const ossClient = new OSS({
        bucket: 'uranus-lemon',
        region: 'oss-cn-shenzhen',
        accessKeyId: stsResult.AccessKeyId,
        accessKeySecret: stsResult.AccessKeySecret,
        stsToken: stsResult.SecurityToken,
        secure: true,
      });
      try {
        const { objects } = await ossClient.list({ "max-keys": 1000, prefix: "template" }, {});
        await this.copyFileFromTemplate(ossClient, objects.map(item => item.name), path);
      } catch (ex) {
        await this.watermelonModel.findOneAndUpdate({ _id: saveRes.id }, { init_failed: true });
      }
    } else {
      throw new Error('系统繁忙，请稍后再试');
    }
    return await this.watermelonModel.find({ userId: user.id });
  }

  async UploadTokenGet(ctx, user: IUser, path: string): Promise<ISTSAuthResult> {
    const pathInfo = await this.watermelonModel.findOne({ userId: user.id, path });

    if (!pathInfo) {
      throw new Error('游戏路径记录未找到');
    }

    if (pathInfo.code !== PayCode.success) {
      throw new Error('游戏路径记录待支付');
    }

    if (pathInfo.init_failed) {
      const stsResult = await this.STSAuth(user);
      const ossClient = new OSS({
        bucket: 'uranus-lemon',
        region: 'oss-cn-shenzhen',
        accessKeyId: stsResult.AccessKeyId,
        accessKeySecret: stsResult.AccessKeySecret,
        stsToken: stsResult.SecurityToken,
        secure: true,
      });
      try {
        const { objects } = await ossClient.list({ "max-keys": 1000, prefix: "template" }, {});
        await this.copyFileFromTemplate(ossClient, objects.map(item => item.name), path);
      } catch (ex) {
        throw ex;
      }
      return stsResult;
    } else {
      return await this.STSAuth(user, path);
    }
  }
}
