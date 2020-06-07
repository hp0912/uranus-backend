import * as jwt from 'jsonwebtoken';
import { Inject, Service } from "typedi";
import { UserEntity } from '../common/schema/UserEntity';
import config from '../config';
import UserModel from "../models/UserModel";

@Service()
export default class AutnService {
  @Inject()
  private userModel: UserModel;

  async checkLogin(ctx): Promise<UserEntity> {
    const session = ctx.cookies.get('uranus_session');

    let decoded: any = null;

    try {
      decoded = jwt.verify(session, config.passsalt);
    } catch {
      throw new Error('登录信息已过期');
    }

    const { userId: _id, lastLoginTime } = decoded;
    const user = await this.userModel.findOne({ _id, lastLoginTime });

    return user;
  }
}
