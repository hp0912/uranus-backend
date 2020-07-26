import { Authorized, Body, Ctx, CurrentUser, Delete, Get, JsonController, Post, QueryParams } from "routing-controllers";
import { Inject, Service } from "typedi";
import { CommentEntity, ICommentInput } from "../common/schema/CommentEntity";
import { ICommentEntity, IHttpResult, IUser } from "../common/types/commom";
import CommentService, { ICommentListParams } from "../services/CommentService";

@JsonController('/comment')
@Service()
export class CommentController {
  @Inject()
  private commentService: CommentService;

  @Authorized()
  @Post('/submit')
  async commentSubmit(
    @Ctx() ctx,
    @Body() data: ICommentInput,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<CommentEntity>> {
    const comment = await this.commentService.submit(data, user);

    return { code: 200, message: '', data: comment };
  }

  @Get('/list')
  async commentList(
    @Ctx() ctx,
    @QueryParams() data: ICommentListParams,
  ): Promise<IHttpResult<ICommentEntity[]>> {
    const comments = await this.commentService.commentList(data);

    return { code: 200, message: '', data: comments };
  }

  @Authorized()
  @Delete('/delete')
  async commentDelete(
    @Ctx() ctx,
    @Body() data: { commentId: string },
  ): Promise<IHttpResult<null>> {
    await this.commentService.commentDelete(data);

    return { code: 200, message: '', data: null };
  }
}