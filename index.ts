import Koa from 'koa';
import cors from 'koa2-cors';
import "reflect-metadata";
import { Action, useContainer, useKoaServer as UseKoaServer } from "routing-controllers";
import { Container } from 'typedi';
import config from "./config";
import { UserController } from './controllers/UserController';
import ErrorMiddleware from './middleware/ErrorMiddleware';
import AutnService from './services/AutnService';
import { connect } from "./utils/mongodb";

async function start() {
  const app = new Koa();

  app.use(cors({
    origin: (ctx) => {
      return 'http://localhost:3000';
    },
    maxAge: 3600,
    credentials: true,
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  }));

  await connect();

  useContainer(Container);

  UseKoaServer(app, {
    authorizationChecker: async (action: Action): Promise<boolean> => {
      const user = await Container.get<AutnService>(AutnService).checkLogin(action.context);
      action.context.user = user;
      if (!user) {
        throw new Error('请重新登录');
      }
      return !!user;
    },
    currentUserChecker: async (action: Action) => {
      return action.context.user;
    },
    defaultErrorHandler: false,
    routePrefix: '/api',
    controllers: [
      UserController,
    ],
    middlewares: [ErrorMiddleware],
  });

  app.listen(config.server_port);

  console.log(`URANUS 以${config.server_port}端口启动服务成功了~~~`);
}

start();