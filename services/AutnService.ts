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
}
