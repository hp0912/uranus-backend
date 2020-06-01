import * as jwt from 'jsonwebtoken';
import { Inject, Service } from "typedi";
import { UserEntity } from '../common/schema/UserEntity';
import UserModel from "../models/UserModel";

@Service()
export default class AutnService {
  @Inject()
  private userModel: UserModel;

  async checkLogin(ctx): Promise<UserEntity> {
    const token = ctx.cookies.get('_uranus_token');
    const uid = parseInt(ctx.cookies.get('_uranus_uid'), 10);

    if (token && uid) {
      try {
        const result = await this.userModel.findOne({ id: uid });

        if (!result) {
          return null;
        }
        
        const decoded = jwt.verify(token, result.passsalt as string) as any;

        if (decoded.uid === uid) {
          return result;
        }
      } catch (e) {
        console.error(e);
      }
    }

    return null;
  }

  setCookie(ctx, uid: number, passsalt: string) {
    const token = jwt.sign({ uid }, passsalt, { expiresIn: '7 days' });
    const expires = new Date();
    expires.setTime(expires.getTime() + 7 * 86400 * 1000);

    ctx.cookies.set('_uranus_token', token, {
      expires,
      httpOnly: true,
    });
    ctx.cookies.set('_uranus_uid', uid, {
      expires,
      httpOnly: true,
    });
  }
}
