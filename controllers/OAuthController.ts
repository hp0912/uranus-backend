import { Ctx, Get, JsonController, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import { IHttpResult } from "../common/types/commom";
import AutnService from "../services/AutnService";

@JsonController('/oauth')
@Service()
export class OAuthController {
  @Inject()
  private autnService: AutnService;

  @Get('/github')
  async githubOAuth(
    @Ctx() ctx,
    @QueryParam('code') code: string,
  ): Promise<IHttpResult<null>> {
    await this.autnService.githubOAuth(ctx, code);
    return { code: 200, message: '', data: null };
  }
}