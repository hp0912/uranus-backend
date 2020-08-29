import { Authorized, Body, Ctx, CurrentUser, Get, JsonController, Post, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import { TokenEntity, TokenType } from "../common/schema/TokenEntity";
import { IHttpResult, IUser } from "../common/types/commom";
import TokenService from "../services/TokenService";

@JsonController('/token')
@Service()
export class TokenController {
  @Inject()
  private tokenService: TokenService;

  @Authorized()
  @Get('/get')
  async getToken(
    @Ctx() ctx,
    @QueryParam("tokenType") tokenType?: TokenType,
    @QueryParam("targetId") targetId?: string,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<TokenEntity>> {
    const token = await this.tokenService.getToken({ tokenType, targetId }, user);

    return { code: 200, message: '', data: token };
  }

  @Authorized()
  @Post('/update')
  async updateToken(
    @Ctx() ctx,
    @Body() data: { tokenType: TokenType, targetId: string },
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<TokenEntity>> {
    const token = await this.tokenService.updateToken(data, user);

    return { code: 200, message: '', data: token };
  }
}