import { Context } from "koa";
import { KoaMiddlewareInterface, Middleware } from "routing-controllers";

@Middleware({ type: "before" })
export default class ErrorMiddleware implements KoaMiddlewareInterface {
  async use(context: Context, next: (err?: any) => Promise<any>): Promise<any> {
    try {
      await next();
    } catch (ex) {
      context.body = { code: 500, message: ex.message, data: null };
    }
  }
}
