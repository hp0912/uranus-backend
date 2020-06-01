import * as jwt from 'jsonwebtoken';
import QcloudSms from 'qcloudsms_js';
import { /* Inject, */ Service } from 'typedi';

@Service()
export default class UserService {

  async getSmsCode(ctx, phoneNumber: string): Promise<void> {
    const appid = 'xxxx'; // config.smsappid
    const appkey = 'xxxx'; // config.smsappkey
    const phoneNumbers = [phoneNumber];
    const templateId = 191869;
    const smsSign = '嗷呜的个人主页';
    const sms = QcloudSms(appid, appkey);
    const smsCode = (Math.random() + '').substr(2, 6);
    const ssender = sms.SmsSingleSender();
    const params = [smsCode];

    if (!phoneNumber.match(/^[1][3578]\d{9}$/)) {
      throw new Error('请输入正确的手机号');
    }

    ssender.sendWithParam(86, phoneNumbers[0], templateId, params, smsSign, '', '', (err, res, resData) => {
      if (err) {
        console.error('err: ', err.message, phoneNumber, smsCode);
      } else {
        console.log('发送验证码成功', phoneNumber, smsCode);
      }
    });

    const token = jwt.sign({ phoneNumber, smsCode }, 'passsalt', { expiresIn: '10m' }); // 十分钟内有效
    const expires = new Date();
    expires.setTime(expires.getTime() + 7 * 86400 * 1000);

    ctx.cookies.set('_uranus_token', token, {
      expires,
      httpOnly: true,
    });
  }
}