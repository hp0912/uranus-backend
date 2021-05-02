import { WatermelonEntity } from "../common/schema/WatermelonEntity";
import { Authorized, Body, Ctx, CurrentUser, Get, JsonController, Post, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import { IHttpResult, IUser } from "../common/types/commom";
import WatermelonService from "../services/WatermelonService";
import { ISTSAuthResult } from "../services/STSService";

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
  @Get('/upload-token/get')
  async UploadTokenGet(
    @Ctx() ctx,
    @QueryParam("path") path: string,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<ISTSAuthResult>> {
    const result = await this.watermelonService.UploadTokenGet(ctx, user, path);
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