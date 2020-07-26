import STS from '@alicloud/pop-core';
import crypto from 'crypto';
import { Service } from 'typedi';
import { UserEntity } from '../common/schema/UserEntity';
import config from '../config';

export interface ISTSAuth {
  SecurityToken: string;
  AccessKeyId: string;
  AccessKeySecret: string;
  Expiration: string;
}

export interface ISTSAuthResult extends ISTSAuth {
  Policy: string;
}

export interface ISTSAuthForFormResult {
  OSSAccessKeyId: string;
  policy: string;
  Signature: string;
}

@Service()
export default class STSService {
  STSClient = new STS({
    accessKeyId: config.STSAccessKeyId,
    accessKeySecret: config.STSAccessKeySecret,
    endpoint: 'https://sts.cn-beijing.aliyuncs.com',
    apiVersion: '2015-04-01',
  });
  Policy = JSON.stringify(config.STSPolicy);

  async STSAuth(user: UserEntity): Promise<ISTSAuthResult> {
    let Policy = '';

    if (user.accessLevel >= 9) {
      // 限制操作目录
      const policy = JSON.parse(this.Policy);
      const resource = policy.Statement[0].Resource[0];
      policy.Statement[0].Resource[0] = `${resource}/*`;
      Policy = JSON.stringify(policy);
    } else {
      // 限制操作目录
      const policy = JSON.parse(this.Policy);
      const resource = policy.Statement[0].Resource[0];
      policy.Statement[0].Resource[0] = `${resource}/${user.id}/*`;
      Policy = JSON.stringify(policy);
    }

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

  async STSAuthForForm(filename: string, user: UserEntity): Promise<ISTSAuthForFormResult> {
    if (filename.includes('/')) {
      throw new Error('文件名不合法');
    }

    const suffix = filename.slice(filename.lastIndexOf('.') + 1);

    // 限制图片上传格式，系统管理员不受此限制
    if (user.accessLevel !== 10 && !['jpeg', 'jpg', 'png', 'webp'].includes(suffix)) {
      throw new Error('图片格式不支持');
    }

    const maxSize = user.accessLevel === 10 ? 10485760 : 2621440; // 上传文件大小限制 10M / 2.5M
    const expiration = new Date();
    expiration.setTime(expiration.getTime() + 10 * 60 * 1000); // 十分钟

    const policyText = {
      expiration, // 设置Policy的失效时间，如果超过失效时间，就无法通过此Policy上传文件
      conditions: [
        ["eq", "$key", `uranus/user/${user.id}/${filename}`],
        ["content-length-range", 0, maxSize] // 设置上传文件的大小限制，如果超过限制，文件上传到OSS会报错
      ]
    };
    const policy = Buffer.from(JSON.stringify(policyText), 'utf8').toString('base64');
    const signature = crypto.createHmac('sha1', config.STSAccessKeySecret);

    return { OSSAccessKeyId: config.STSAccessKeyId, policy, Signature: signature.update(policy).digest('base64') };
  }
}