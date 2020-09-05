import { Authorized, Body, Ctx, CurrentUser, Get, JsonController, Post, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import { PayCode, PayMethod, PayType } from "../common/schema/PayEntity";
import { IHttpResult, IPayNotifyRequest, IScanPayResponse, IUser } from "../common/types/commom";
import PayService from "../services/PayService";

@JsonController('/pay')
@Service()
export class PayController {
  @Inject()
  private payService: PayService;

  @Authorized()
  @Post('/initPay')
  async initPay(
    @Ctx() ctx,
    @Body() data: { orderId: string, payType: PayType, payMethod: PayMethod },
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<IScanPayResponse>> {
    const payData = await this.payService.initPay(data, user);

    return { code: 200, message: '', data: payData };
  }

  @Authorized()
  @Get('/queryStatus')
  async queryStatus(
    @Ctx() ctx,
    @QueryParam("orderId") orderId?: string,
  ): Promise<IHttpResult<{ code: PayCode, status: string }>> {
    const result = await this.payService.queryStatus(orderId);

    return { code: 200, message: '', data: result };
  }

  @Post('/notify')
  async notify(
    @Ctx() ctx,
    @Body() data: IPayNotifyRequest,
  ): Promise<string> {
    const result = await this.payService.notify(data);

    if (!result) {
      return 'fail';
    }

    return 'success';
  }
}