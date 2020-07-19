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

  async status(ctx): Promise<UserEntity> {
    const session = ctx.cookies.get('uranus_session');

    let decoded: any = null;

    try {
      decoded = jwt.verify(session, config.passsalt);
    } catch {
      return null;
    }

    const { userId: _id, lastLoginTime } = decoded;

    if (!_id || !lastLoginTime) {
      return null;
    }

    const user = await this.userModel.findOne({ _id, lastLoginTime });

    if (!user) {
      return null;
    }

    delete user.password;
    delete user.lastLoginTime;
    delete (user as any).__v;

    return user;
  }

  async userSearch(options: { current?: number, pageSize?: number, searchValue?: string }): Promise<UserEntity[]> {
    const { current, pageSize, searchValue } = options;
    const limit = pageSize ? pageSize : 15;
    const offset = current ? (current - 1) * limit : 0;
    const conditions = searchValue ? { $or: [{ username: { $regex: new RegExp(searchValue) } }, { nickname: { $regex: new RegExp(searchValue) } }] } as any : {};
    const select = { id: 1, username: 1, nickname: 1, avatar: 1 };

    return await this.userModel.findAdvanced({ conditions, offset, limit, select });
  }

  async userList(options: { current?: number, pageSize?: number, searchValue?: string }): Promise<{ users: UserEntity[], total: number }> {
    const { current, pageSize, searchValue } = options;
    const limit = pageSize ? pageSize : 15;
    const offset = current ? (current - 1) * limit : 0;
    const conditions = searchValue ? { $or: [{ username: { $regex: new RegExp(searchValue) } }, { nickname: { $regex: new RegExp(searchValue) } }] } as any : {};
    const select = { password: 0, lastLoginTime: 0 };

    const [users, total] = await Promise.all([
      this.userModel.findAdvanced({ conditions, offset, limit, select }),
      this.userModel.countDocuments(conditions),
    ]);

    return { users, total };
  }

  async updateUserProfile(data: UserEntity, user: UserEntity): Promise<UserEntity> {
    this.userValidation(data);

    const { avatar, nickname, signature, personalProfile } = data;

    const userResult = await this.userModel.findOneAndUpdate(
      { _id: user.id, lastLoginTime: user.lastLoginTime, activated: true },
      { avatar, nickname, signature, personalProfile },
    );

    if (!userResult) {
      throw new Error('登录信息已过期');
    }

    delete userResult.password;
    delete userResult.lastLoginTime;
    delete (userResult as any).__v;

    return userResult;
  }

  async updateUserForAdmin(data: UserEntity): Promise<void> {
    if (!data.id) {
      throw new Error('缺少参数id');
    }

    this.userValidation(data);

    const { id, ...updateData } = data;

    const userResult = await this.userModel.findOneAndUpdate({ _id: id }, updateData);

    if (!userResult) {
      throw new Error('未查找到该用户相关信息');
    }
  }

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
      registerTime: Date.now(),
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

    if (!user.activated) {
      throw new Error('该用户已被注销');
    }

    const lastLoginTime = Date.now();

    await this.userModel.findOneAndUpdate({ _id: user.id }, { lastLoginTime });

    const session = jwt.sign({ userId: user.id, lastLoginTime }, config.passsalt, { expiresIn: '7 days' });
    this.setToken(ctx, session);

    delete user.password;
    delete user.lastLoginTime;
    delete (user as any).__v;

    return user;
  }

  async signOut(ctx): Promise<void> {
    this.setToken(ctx, null);
  }

  async resetPassword(ctx, data: ISignUpParams): Promise<void> {
    const { username, password } = data;

    this.verify(ctx, data);

    const IsRegExist = await this.userModel.findOne({ username });
    const lastLoginTime = Date.now();
    const passwordSha1 = sha1(password + sha1(config.passsalt));

    if (IsRegExist) {
      await this.userModel.findOneAndUpdate({ _id: IsRegExist.id }, { password: passwordSha1, lastLoginTime });
    } else {
      const user: UserEntity = {
        username,
        nickname: username,
        password: passwordSha1,
        lastLoginTime,
      };

      await this.userModel.save(user);
    }
  }

  private userValidation(user: UserEntity) {
    if (user.avatar === '') {
      throw new Error('用户头像不能为空');
    }

    if (user.avatar && !user.avatar.match(/\.(?:jpeg|jpg|png|webp)$/)) {
      throw new Error('用户头像格式不合法');
    }

    if (user.nickname === '') {
      throw new Error('用户昵称不能为空');
    }

    if (user.nickname && user.nickname.length > 7) {
      throw new Error('用户昵称不能大于7个字符');
    }

    if (user.signature && user.signature.length > 30) {
      throw new Error('用户签名不能大于30个字符');
    }

    if (user.personalProfile && user.personalProfile.length > 200) {
      throw new Error('用户简介不能大于200个字符');
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