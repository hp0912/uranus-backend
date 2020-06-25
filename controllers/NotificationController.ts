import { Authorized, Body, Ctx, CurrentUser, Get, JsonController, Post, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import { NotificationEntity } from "../common/schema/NotificationEntity";
import { IHttpResult, IUser } from "../common/types/commom";
import NotificationService from "../services/NotificationService";

@JsonController('/notification')
@Service()
export class NotificationController {
  @Inject()
  private notificationService: NotificationService;

  @Authorized()
  @Get('/notificationCount')
  async notificationCount(
    @Ctx() ctx,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<number>> {
    const count = await this.notificationService.notificationCount(user);

    return { code: 200, message: '', data: count };
  }

  @Authorized()
  @Get('/notificationList')
  async notificationList(
    @Ctx() ctx,
    @QueryParam('lastNotiId', { required: false }) lastNotiId: string,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<NotificationEntity[]>> {
    const notifications = await this.notificationService.notificationList(lastNotiId, user);

    return { code: 200, message: '', data: notifications };
  }

  @Authorized()
  @Get('/notificationAll')
  async notificationAll(
    @Ctx() ctx,
    @QueryParam('lastNotiId', { required: false }) lastNotiId: string,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<NotificationEntity[]>> {
    const notifications = await this.notificationService.notificationAll(lastNotiId, user);

    return { code: 200, message: '', data: notifications };
  }

  @Authorized()
  @Post('/markAsRead')
  async markAsRead(
    @Ctx() ctx,
    @Body() notification: NotificationEntity,
  ): Promise<IHttpResult<null>> {
    await this.notificationService.markAsRead(notification);

    return { code: 200, message: '', data: null };
  }

  @Authorized()
  @Post('/markAsReadForAll')
  async markAsReadForAll(
    @Ctx() ctx,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<null>> {
    await this.notificationService.markAsReadForAll(user);

    return { code: 200, message: '', data: null };
  }

  @Authorized([10])
  @Post('/sendNotification')
  async sendNotification(
    @Ctx() ctx,
    @Body() data: { notification: NotificationEntity, broadcast: boolean },
  ): Promise<IHttpResult<null>> {
    await this.notificationService.sendNotification(data);

    return { code: 200, message: '', data: null };
  }

}