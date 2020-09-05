import { Authorized, Body, Ctx, CurrentUser, Get, JsonController, Post, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import { PayCode, PayMethod, PayType } from "../common/schema/PayEntity";
import {
  ICashierPayData,
  IHttpResult,
  IPayNotifyRequest,
  IScanPayResponse,
  IUser,
  IWAPPayResponse,
} from "../common/types/commom";
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
  ): Promise<IHttpResult<IScanPayResponse | IWAPPayResponse | ICashierPayData>> {
    const { orderId, payMethod, payType } = data;

    if (payMethod === PayMethod.scan) {
      const payData = await this.payService.initScanPay({ orderId, payType });
      return { code: 200, message: '', data: payData };
    } else if (payMethod === PayMethod.wap) {
      const payData = await this.payService.initWAPPay({ orderId, payType });
      return { code: 200, message: '', data: payData };
    } else if (payMethod === PayMethod.cashier) {
      const payData = await this.payService.initCashierPay({ orderId, payType });
      return { code: 200, message: '', data: payData };
    } else {
      throw new Error('非法的参数');
    }
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