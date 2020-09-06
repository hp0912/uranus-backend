import { Authorized, Body, BodyParam, Ctx, CurrentUser, Get, JsonController, Post, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import { GoodsType, OrderEntity } from "../common/schema/OrderEntity";
import { UserEntity } from "../common/schema/UserEntity";
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

  @Authorized()
  @Get('/receivables')
  async receivables(
    @Ctx() ctx,
    @QueryParam("current", { required: false }) current?: number,
    @QueryParam("pageSize", { required: false }) pageSize?: number,
    @QueryParam("searchValue", { required: false }) searchValue?: string,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<{ orders: OrderEntity[], total: number }>> {
    const orderResult = await this.orderService.receivables({ current, pageSize, searchValue }, user);

    return { code: 200, message: '', data: orderResult };
  }

  @Authorized()
  @Get('/mine')
  async mine(
    @Ctx() ctx,
    @QueryParam("current", { required: false }) current?: number,
    @QueryParam("pageSize", { required: false }) pageSize?: number,
    @QueryParam("searchValue", { required: false }) searchValue?: string,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<{ orders: OrderEntity[], total: number }>> {
    const orderResult = await this.orderService.mine({ current, pageSize, searchValue }, user);

    return { code: 200, message: '', data: orderResult };
  }

  @Authorized([8])
  @Get('/admin/get')
  async getOrdersForAdmin(
    @Ctx() ctx,
    @QueryParam("current", { required: false }) current?: number,
    @QueryParam("pageSize", { required: false }) pageSize?: number,
    @QueryParam("searchValue", { required: false }) searchValue?: string,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<{ orders: OrderEntity[], users: UserEntity[], total: number }>> {
    const orderResult = await this.orderService.getOrdersForAdmin({ current, pageSize, searchValue }, user);

    return { code: 200, message: '', data: orderResult };
  }

  @Authorized([10])
  @Post('/admin/refund')
  async orderRefundForAdmin(
    @Ctx() ctx,
    @BodyParam("orderId") orderId?: string,
  ): Promise<IHttpResult<null>> {
    await this.orderService.orderRefundForAdmin(orderId);

    return { code: 200, message: '', data: null };
  }
}