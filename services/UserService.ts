import alicloudSms from '@alicloud/pop-core';
import * as jwt from 'jsonwebtoken';
import { /* Inject, */ Service } from 'typedi';
import config from '../config';

@Service()
export default class UserService {

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
    const expires = new Date();
    expires.setTime(expires.getTime() + 7 * 86400 * 1000);

    ctx.cookies.set('_uranus_token', token, {
      expires,
      httpOnly: true,
    });
  }
}