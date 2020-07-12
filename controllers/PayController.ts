import { Authorized, Body, Ctx, CurrentUser, JsonController, Post } from "routing-controllers";
import { Inject, Service } from "typedi";
import { PayMethod, PayType } from "../common/schema/PayEntity";
import { IHttpResult, IPayData, IUser } from "../common/types/commom";
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
  ): Promise<IHttpResult<IPayData>> {
    const payData = await this.payService.initPay(data, user);

    return { code: 200, message: '', data: payData };
  }
}