import Koa from 'koa';
import cors from 'koa2-cors';
import "reflect-metadata";
import { Action, useContainer, useKoaServer as UseKoaServer } from "routing-controllers";
import { Container } from 'typedi';
import config from "./config";
import { NotificationController } from './controllers/NotificationController';
import { STSController } from './controllers/STSController';
import { TagController } from './controllers/TagController';
import { UserController } from './controllers/UserController';
import { WebsiteSettingsController } from './controllers/WebsiteSettingsController';
import ErrorMiddleware from './middleware/ErrorMiddleware';
import AutnService from './services/AutnService';
import { connect } from "./utils/mongodb";

export async function start() {
  const app = new Koa();

  app.use(cors({
    origin: (ctx) => {
      return 'http://localhost:3000';
    },
    maxAge: 3600,
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  }));

  await connect();

  useContainer(Container);

  UseKoaServer(app, {
    authorizationChecker: async (action: Action, roles: number[]): Promise<boolean> => {
      const user = await Container.get<AutnService>(AutnService).checkLogin(action.context);
      action.context.user = user;
      if (!user) {
        throw new Error('请重新登录');
      }

      if (!roles.length) {
        return true;
      }

      if (user.accessLevel >= roles[0]) {
        return true;
      }

      return false;
    },
    currentUserChecker: async (action: Action) => {
      return action.context.user;
    },
    defaultErrorHandler: false,
    routePrefix: '/api',
    controllers: [
      NotificationController,
      STSController,
      TagController,
      UserController,
      WebsiteSettingsController,
    ],
    middlewares: [ErrorMiddleware],
  });

  console.log('启动配置文件: ', config);

  app.listen(config.serverPort);

  console.log(`URANUS 以${config.serverPort}端口启动服务成功了~~~`);
}