import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { Inject, Service } from "typedi";
import { UserEntity } from '../common/schema/UserEntity';
import config from '../config';
import UserModel from "../models/UserModel";
import UserService from './UserService';

@Service()
export default class AutnService {
  @Inject()
  private userModel: UserModel;
  @Inject()
  private userService: UserService;

  async checkLogin(ctx): Promise<UserEntity> {
    const session = ctx.cookies.get('uranus_session');

    let decoded: any = null;

    try {
      decoded = jwt.verify(session, config.passsalt);
    } catch {
      return null;
    }

    const { userId: _id, lastLoginTime } = decoded;
    const user = await this.userModel.findOne({ _id, lastLoginTime, activated: true });

    return user;
  }

  async githubOAuth(ctx, code: string): Promise<void> {
    const { githubClientID, githubClientSecret } = config;
    const start = Date.now();

    const tokenResponse = await axios({
      method: 'POST',
      url: `https://github.com/login/oauth/access_token?client_id=${githubClientID}&client_secret=${githubClientSecret}&code=${code}`,
      headers: {
        accept: 'application/json'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    const githubUser = await axios({
      method: 'GET',
      url: `https://api.github.com/user`,
      headers: {
        accept: 'application/json',
        Authorization: `token ${accessToken}`
      }
    });

    const { login, id, node_id: githubNodeId, avatar_url: avatar, name } = githubUser.data;
    const username = `github-${id}`;
    const nickname = name ? name : login;
    const password = '000000';

    let userResult = await this.userModel.findOne({ githubId: id });

    if (!userResult) {
      userResult = await this.userModel.save({
        username,
        nickname,
        password,
        avatar,
        githubId: id,
        githubNodeId,
        registerTime: start,
      });
    } else {
      if (!userResult.activated) {
        throw new Error('该用户已被注销');
      }

      await this.userModel.findOneAndUpdate({ _id: userResult.id }, { lastLoginTime: start });
    }

    const session = jwt.sign({ userId: userResult.id, lastLoginTime: start }, config.passsalt, { expiresIn: '7 days' });

    this.userService.setToken(ctx, session);

    console.log(`GitHub授权登录耗时${Date.now() - start}毫秒。`);
  }

  async qqOAuth(ctx, code: string): Promise<void> {
    const { qqClientID, qqClientSecret } = config;
    const start = Date.now();

    const tokenResponse = await axios({
      method: 'GET',
      url: `https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=${qqClientID}&client_secret=${qqClientSecret}&code=${code}&redirect_uri=https%3A%2F%2Fhouhoukang.com%2Fqq%2Foauth%2Fauthorize&fmt=json`,
      headers: {
        accept: 'application/json'
      }
    });

    const { code: tcode, msg: tmsg, access_token: accessToken } = tokenResponse.data;

    if (tcode !== undefined && tcode !== 0) {
      throw new Error(tmsg);
    }

    const qqOpenid = await axios({
      method: 'GET',
      url: `https://graph.qq.com/oauth2.0/me?access_token=${accessToken}&fmt=json`,
      headers: {
        accept: 'application/json',
        Authorization: `token ${accessToken}`
      }
    });

    const { code: ocode, msg: omsg, openid } = qqOpenid.data;

    if (ocode !== undefined && ocode !== 0) {
      throw new Error(omsg);
    }

    const qqUser = await axios({
      method: 'GET',
      url: `https://graph.qq.com/user/get_user_info?access_token=${accessToken}&oauth_consumer_key=${qqClientID}&openid=${openid}`,
      headers: {
        accept: 'application/json',
        Authorization: `token ${accessToken}`
      }
    });

    const { ret, msg, nickname, figureurl_qq_2 } = qqUser.data;

    if (ret !== undefined && ret !== 0) {
      throw new Error(msg);
    }

    const username = `qq-${openid}`;
    const password = '000000';

    let userResult = await this.userModel.findOne({ qqOpenid: openid });

    if (!userResult) {
      userResult = await this.userModel.save({
        username,
        nickname,
        password,
        avatar: figureurl_qq_2,
        qqOpenid: openid,
        registerTime: start,
      });
    } else {
      if (!userResult.activated) {
        throw new Error('该用户已被注销');
      }

      await this.userModel.findOneAndUpdate({ _id: userResult.id }, { lastLoginTime: start });
    }

    const session = jwt.sign({ userId: userResult.id, lastLoginTime: start }, config.passsalt, { expiresIn: '7 days' });

    this.userService.setToken(ctx, session);

    console.log(`QQ授权登录耗时${Date.now() - start}毫秒。`);
  }
}
