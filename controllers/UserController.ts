import { Authorized, Body, Ctx, CurrentUser, Delete, Get, JsonController, Post, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import { UserEntity } from "../common/schema/UserEntity";
import { IHttpResult, IUser } from "../common/types/commom";
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

  @Authorized()
  @Get('/search')
  async userSearch(
    @Ctx() ctx,
    @QueryParam("current", { required: false }) current?: number,
    @QueryParam("pageSize", { required: false }) pageSize?: number,
    @QueryParam("searchValue", { required: false }) searchValue?: string,
  ): Promise<IHttpResult<UserEntity[]>> {
    const usersResult = await this.userService.userSearch({ current, pageSize, searchValue });

    return { code: 200, message: '', data: usersResult };
  }

  // 需要权限等级6以及以上的权限才能获取用户列表
  @Authorized([6])
  @Get('/admin/userList')
  async userList(
    @Ctx() ctx,
    @QueryParam("current", { required: false }) current?: number,
    @QueryParam("pageSize", { required: false }) pageSize?: number,
    @QueryParam("searchValue", { required: false }) searchValue?: string,
  ): Promise<IHttpResult<{ users: UserEntity[], total: number }>> {
    const usersResult = await this.userService.userList({ current, pageSize, searchValue });

    return { code: 200, message: '', data: usersResult };
  }

  @Authorized()
  @Post('/updateUserProfile')
  async updateUserProfile(
    @Body() data: IUser,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<UserEntity>> {
    const userResult = await this.userService.updateUserProfile(data, user);

    return { code: 200, message: '', data: userResult };
  }

  @Authorized([10])
  @Post('/updateUserForAdmin')
  async updateUserForAdmin(
    @Body() data: IUser,
  ): Promise<IHttpResult<null>> {
    await this.userService.updateUserForAdmin(data);

    return { code: 200, message: '', data: null };
  }

  @Post('/getSmsCode')
  async getSmsCode(
    @Ctx() ctx,
    @Body() data: { phoneNumber: string, token: string },
  ): Promise<IHttpResult<null>> {
    await this.userService.getSmsCode(ctx, data);

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