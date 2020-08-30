import Koa from 'koa';
import cors from 'koa2-cors';
import "reflect-metadata";
import { Action, useContainer, useKoaServer as UseKoaServer } from "routing-controllers";
import { Container } from 'typedi';
import config from "./config";
import { ArticleController } from './controllers/ArticleController';
import { CommentController } from './controllers/CommentController';
import { LikesController } from './controllers/LikesController';
import { MessageController } from './controllers/MessageController';
import { NotificationController } from './controllers/NotificationController';
import { OAuthController } from './controllers/OAuthController';
import { OrderController } from './controllers/OrderController';
import { PayController } from './controllers/PayController';
import { ProbeController } from './controllers/ProbeController';
import { STSController } from './controllers/STSController';
import { TagController } from './controllers/TagController';
import { TokenController } from './controllers/TokenController';
import { UserController } from './controllers/UserController';
import { WebsiteSettingsController } from './controllers/WebsiteSettingsController';
import ErrorMiddleware from './middleware/ErrorMiddleware';
import AutnService from './services/AutnService';
import { connect } from "./utils/mongodb";

export async function start() {
  const app = new Koa();

  if (process.env.CONFIG_ENV !== 'prod') {
    app.use(cors({
      origin: (ctx) => {
        return 'http://localhost:3000';
      },
      maxAge: 3600,
      credentials: true,
      allowMethods: ['GET', 'POST', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    }));
  }

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
      ArticleController,
      CommentController,
      LikesController,
      MessageController,
      NotificationController,
      OAuthController,
      OrderController,
      PayController,
      ProbeController,
      STSController,
      TagController,
      TokenController,
      UserController,
      WebsiteSettingsController,
    ],
    middlewares: [ErrorMiddleware],
  });

  console.log('启动配置文件: ', config);

  app.listen(config.serverPort);

  console.log(`URANUS 以${config.serverPort}端口启动服务成功了~~~`);
}