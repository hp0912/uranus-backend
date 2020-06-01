import { Body, Ctx, /* Authorized, CurrentUser, */ Get, JsonController/* QueryParam */, Post } from "routing-controllers";
import { Inject, Service } from "typedi";
import { IHttpResult } from "../common/types/commom";
import UserService from "../services/UserService";

@JsonController('/user')
@Service()
export class UserController {
  @Inject()
  private userService: UserService;

  @Post('/getSmsCode')
  async getSmsCode(
    @Ctx() ctx,
    @Body() data: { phoneNumber: string },
  ): Promise<IHttpResult<null>> {
    await this.userService.getSmsCode(ctx, data.phoneNumber);

    return { code: 200, message: '发送验证码成功', data: null };
  }

  @Get('/login')
  async login() {
    return 123;
  }

}