import { Authorized, Ctx, CurrentUser, Get, JsonController, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import { UserEntity } from "../common/schema/UserEntity";
import { IHttpResult } from "../common/types/commom";
import STSService, { ISTSAuthForFormResult, ISTSAuthResult } from "../services/STSService";

@JsonController('/sts')
@Service()
export class STSController {
  @Inject()
  private stsService: STSService;

  @Authorized()
  @Get('/stsAuth')
  async stsAuth(
    @Ctx() ctx,
    @CurrentUser() user?: UserEntity,
  ): Promise<IHttpResult<ISTSAuthResult>> {
    const auth = await this.stsService.STSAuth(user);

    return { code: 200, message: '', data: auth };
  }

  @Authorized()
  @Get('/stsAuthForForm')
  async stsAuthForForm(
    @Ctx() ctx,
    @QueryParam("filename") filename: string,
    @CurrentUser() user?: UserEntity,
  ): Promise<IHttpResult<ISTSAuthForFormResult>> {
    const auth = await this.stsService.STSAuthForForm(filename, user);

    return { code: 200, message: '', data: auth };
  }

}