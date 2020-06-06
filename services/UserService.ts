import alicloudSms from '@alicloud/pop-core';
import * as jwt from 'jsonwebtoken';
import sha1 from 'sha1';
import { Inject, Service } from 'typedi';
import { UserEntity } from '../common/schema/UserEntity';
import config from '../config';
import UserModel from '../models/UserModel';

export interface ISignUpParams {
  username: string;
  password: string;
  smsCode: string;
}

export interface ISignInParams {
  username: string;
  password: string;
}

@Service()
export default class UserService {
  @Inject()
  private userModel: UserModel;

  smsClient = new alicloudSms({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    endpoint: 'https://dysmsapi.aliyuncs.com',
    apiVersion: '2017-05-25',
  });

  async getSmsCode(ctx, phoneNumber: string): Promise<void> {
    const smsCode = (Math.random() + '').substr(2, 6);
    const params = {
      RegionId: 'cn-hangzhou',
      PhoneNumbers: phoneNumber,
      SignName: '吼吼的个人博客',
      TemplateCode: 'SMS_192150022',
      TemplateParam: `{ code: ${smsCode} }`,
    };

    if (!phoneNumber.match(/^[1][3578]\d{9}$/)) {
      throw new Error('请输入正确的手机号');
    }

    await new Promise((resolve, reject) => {
      this.smsClient.request('SendSms', params, { method: 'POST' }).then((result) => {
        console.log('短信验证码: ', phoneNumber, JSON.stringify(result));
        resolve();
      }, (ex) => {
        reject(ex.message);
      });
    });

    const token = jwt.sign({ phoneNumber, smsCode }, config.passsalt, { expiresIn: '10m' }); // 十分钟内有效
    this.setToken(ctx, token);
  }

  async signUp(ctx, data: ISignUpParams): Promise<void> {
    const { username, password } = data;

    this.verify(ctx, data);

    const IsRegExist = await this.userModel.findOne({ username });

    if (IsRegExist) {
      throw new Error('该手机号已经被注册过了');
    }

    const passwordSha1 = sha1(password + sha1(config.passsalt));
    const user: UserEntity = {
      username,
      nickname: username,
      password: passwordSha1,
    };

    await this.userModel.save(user);
  }

  async signIn(ctx, data: ISignInParams): Promise<UserEntity> {
    const { username, password } = data;
    const passwordSha1 = sha1(password + sha1(config.passsalt));

    const user = await this.userModel.findOne({ username, password: passwordSha1 });

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    const lastAction = Date.now();

    await this.userModel.findOneAndUpdate({ _id: user.id }, { lastAction });

    const session = jwt.sign({ userId: user.id, lastAction }, config.passsalt, { expiresIn: '7 days' });
    this.setToken(ctx, session);

    delete user.id;
    delete user.password;
    delete user.lastAction;
    delete (user as any).__v;

    return user;
  }

  async resetPassword(ctx, data: ISignUpParams): Promise<void> {
    const { username, password } = data;

    this.verify(ctx, data);

    const IsRegExist = await this.userModel.findOne({ username });
    const lastAction = Date.now();
    const passwordSha1 = sha1(password + sha1(config.passsalt));
    
    if (IsRegExist) {
      await this.userModel.findOneAndUpdate({ _id: IsRegExist.id }, { password: passwordSha1, lastAction });
    } else {
      const user: UserEntity = {
        username,
        nickname: username,
        password: passwordSha1,
        lastAction,
      };

      await this.userModel.save(user);
    }
  }

  private verify(ctx, data: ISignUpParams) {
    const { username, password, smsCode } = data;

    if (!username.match(/^[1][3578]\d{9}$/)) {
      throw new Error('请输入正确的手机号');
    }

    if (!password.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/)) {
      throw new Error('密码至少为6位，并且要同时包含大、小写字母和数字');
    }

    const session = ctx.cookies.get('uranus_session');

    let decoded: any = null;

    try {
      decoded = jwt.verify(session, config.passsalt);
    } catch {
      throw new Error('验证码已过期');
    }
    
    if (!decoded) {
      throw new Error('会话信息已过期');
    }

    if (decoded.phoneNumber !== username || decoded.smsCode !== smsCode) {
      throw new Error('验证码无效');
    }
  }

  private setToken(ctx, token: string) {
    const expires = new Date();
    expires.setTime(expires.getTime() + 7 * 86400 * 1000);

    ctx.cookies.set('uranus_session', token, {
      expires,
      httpOnly: true,
    });
  }

}