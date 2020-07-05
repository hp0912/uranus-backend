import { Authorized, Body, Ctx, CurrentUser, JsonController, Post } from "routing-controllers";
import { Inject, Service } from "typedi";
import { GoodsType, OrderEntity } from "../common/schema/OrderEntity";
import { IHttpResult, IUser } from "../common/types/commom";
import OrderService from "../services/OrderService";

@JsonController('/order')
@Service()
export class OrderController {
  @Inject()
  private orderService: OrderService;

  @Authorized()
  @Post('/generateOrder')
  async generateOrder(
    @Ctx() ctx,
    @Body() data: { goodsType: GoodsType, goodsId: string },
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<OrderEntity>> {
    const order = await this.orderService.generateOrder(data, user);

    return { code: 200, message: '提交订单成功，请尽快支付', data: order };
  }
}