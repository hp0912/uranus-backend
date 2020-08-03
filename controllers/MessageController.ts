import { Authorized, Body, Ctx, Delete, Get, JsonController, Post, QueryParam, QueryParams } from "routing-controllers";
import { Inject, Service } from "typedi";
import { MessageEntity } from "../common/schema/MessageEntity";
import { IHttpResult } from "../common/types/commom";
import MessageService from "../services/MessageService";

@JsonController('/message')
@Service()
export class MessageController {
  @Inject()
  private messageService: MessageService;

  @Post('/submit')
  async messageSubmit(
    @Ctx() ctx,
    @Body() data: { message: string },
  ): Promise<IHttpResult<MessageEntity>> {
    const message = await this.messageService.messageSubmit(ctx, data);

    return { code: 200, message: '', data: message };
  }

  @Get('/count')
  async messageCount(
    @Ctx() ctx,
  ): Promise<IHttpResult<number>> {
    const count = await this.messageService.count();

    return { code: 200, message: '', data: count };
  }

  @Get('/list')
  async messageList(
    @Ctx() ctx,
    @QueryParams() data: { lastMessageId: string },
  ): Promise<IHttpResult<MessageEntity[]>> {
    const messages = await this.messageService.messageList(data);

    return { code: 200, message: '', data: messages };
  }

  @Authorized([8])
  @Get('/admin/list')
  async messageListForAdmin(
    @Ctx() ctx,
    @QueryParam("current", { required: false }) current?: number,
    @QueryParam("pageSize", { required: false }) pageSize?: number,
    @QueryParam("searchValue", { required: false }) searchValue?: string,
  ): Promise<IHttpResult<{ messages: MessageEntity[], total: number }>> {
    const messagesResult = await this.messageService.messageListForAdmin({ current, pageSize, searchValue });

    return { code: 200, message: '', data: messagesResult };
  }

  @Authorized([10])
  @Delete('/admin/delete')
  async messageDelete(
    @Ctx() ctx,
    @Body() data: { messageId: string },
  ): Promise<IHttpResult<null>> {
    await this.messageService.delete(data);

    return { code: 200, message: '', data: null };
  }
}