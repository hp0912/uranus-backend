import { Authorized, Body, Ctx, CurrentUser, JsonController, Post } from "routing-controllers";
import { Inject, Service } from "typedi";
import { IHttpResult, IPayData, IUser } from "../common/types/commom";
import PayService from "../services/PayService";

@JsonController('/pay')
@Service()
export class PayController {
  @Inject()
  private payService: PayService;

  @Authorized()
  @Post('/pay')
  async pay(
    @Ctx() ctx,
    @Body() data: {},
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<IPayData>> {
    const payData = await this.payService.pay(data, user);

    return { code: 200, message: '', data: payData };
  }
}