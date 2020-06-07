import { Body, Ctx, Delete, Get, /* Authorized, CurrentUser, */ JsonController/* QueryParam */, Post } from "routing-controllers";
import { Inject, Service } from "typedi";
import { UserEntity } from "../common/schema/UserEntity";
import { IHttpResult } from "../common/types/commom";
import UserService, { ISignInParams, ISignUpParams } from "../services/UserService";

@JsonController('/user')
@Service()
export class UserController {
  @Inject()
  private userService: UserService;

  @Get('/status')
  async status(
    @Ctx() ctx,
  ): Promise<IHttpResult<UserEntity>> {
    const user = await this.userService.status(ctx);

    return { code: 200, message: '', data: user };
  }

  @Post('/getSmsCode')
  async getSmsCode(
    @Ctx() ctx,
    @Body() data: { phoneNumber: string },
  ): Promise<IHttpResult<null>> {
    await this.userService.getSmsCode(ctx, data.phoneNumber);

    return { code: 200, message: '发送验证码成功', data: null };
  }

  @Post('/signUp')
  async signUp(
    @Ctx() ctx,
    @Body() data: ISignUpParams,
  ): Promise<IHttpResult<null>> {
    await this.userService.signUp(ctx, data);

    return { code: 200, message: '注册成功', data: null };
  }

  @Post('/signIn')
  async signIn(
    @Ctx() ctx,
    @Body() data: ISignInParams,
  ): Promise<IHttpResult<UserEntity>> {
    const user = await this.userService.signIn(ctx, data);

    return { code: 200, message: '登录成功', data: user };
  }

  @Delete('/signOut')
  async signOut(
    @Ctx() ctx,
  ): Promise<IHttpResult<null>> {
    await this.userService.signOut(ctx);

    return { code: 200, message: '退出登录', data: null };
  }

  @Post('/resetPassword')
  async resetPassword(
    @Ctx() ctx,
    @Body() data: ISignUpParams,
  ): Promise<IHttpResult<null>> {
    await this.userService.resetPassword(ctx, data);

    return { code: 200, message: '密码重置成功', data: null };
  }

}