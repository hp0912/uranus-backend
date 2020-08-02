import { Authorized, Body, Ctx, CurrentUser, Delete, Get, JsonController, Post, QueryParams } from "routing-controllers";
import { Inject, Service } from "typedi";
import { LikesType } from "../common/schema/LikesEntity";
import { IHttpResult, IUser } from "../common/types/commom";
import LikesService from "../services/LikesService";

@JsonController('/likes')
@Service()
export class LikesController {
  @Inject()
  private likesService: LikesService;

  @Authorized()
  @Post('/like')
  async likesSubmit(
    @Ctx() ctx,
    @Body() data: { likesType: LikesType, targetId: string },
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<number>> {
    const count = await this.likesService.like(data, user);

    return { code: 200, message: '', data: count };
  }

  @Get('/count')
  async likesCount(
    @Ctx() ctx,
    @QueryParams() data: { likesType: LikesType, targetId: string },
  ): Promise<IHttpResult<number>> {
    const count = await this.likesService.count(data);

    return { code: 200, message: '', data: count };
  }

  @Authorized()
  @Delete('/cancel')
  async likesCancle(
    @Ctx() ctx,
    @Body() data: { likesType: LikesType, targetId: string },
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<number>> {
    const count = await this.likesService.cancel(data, user);

    return { code: 200, message: '', data: count };
  }
}