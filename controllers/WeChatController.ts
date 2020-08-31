import { Ctx, Get, JsonController, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import WeChatService from "../services/WeChatService";

@JsonController('/wechat')
@Service()
export class WeChatController {
  @Inject()
  private weChatService: WeChatService;

  @Get('/message')
  async weChatMessage(
    @Ctx() ctx,
    @QueryParam('signature') signature: string,
    @QueryParam('timestamp') timestamp: string,
    @QueryParam('nonce') nonce: string,
    @QueryParam('echostr') echostr: string,
  ): Promise<string> {
    return await this.weChatService.weChatMessage({ signature, timestamp, nonce, echostr });
  }
}