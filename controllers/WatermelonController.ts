import { WatermelonEntity } from "../common/schema/WatermelonEntity";
import { Authorized, Body, Ctx, CurrentUser, Get, JsonController, Post } from "routing-controllers";
import { Inject, Service } from "typedi";
import { IHttpResult, IUser } from "../common/types/commom";
import WatermelonService from "../services/WatermelonService";

@JsonController('/watermelon')
@Service()
export class WatermelonController {
  @Inject()
  private watermelonService: WatermelonService;

  @Authorized()
  @Get('/get')
  async WatermelonGet(
    @Ctx() ctx,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<WatermelonEntity[]>> {
    const result = await this.watermelonService.get(ctx, user);
    return { code: 200, message: '', data: result };
  }

  @Authorized()
  @Post('/add')
  async WatermelonAdd(
    @Ctx() ctx,
    @Body() data: { path: string },
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<WatermelonEntity[]>> {
    const result = await this.watermelonService.add(ctx, data.path, user);
    return { code: 200, message: '', data: result };
  }
}