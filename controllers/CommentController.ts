import { Authorized, Body, BodyParam, Ctx, CurrentUser, Delete, Get, JsonController, Post, QueryParam, QueryParams } from "routing-controllers";
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

  @Authorized([8])
  @Get('/admin/list')
  async commentListForAdmin(
    @Ctx() ctx,
    @QueryParam("current", { required: false }) current?: number,
    @QueryParam("pageSize", { required: false }) pageSize?: number,
    @QueryParam("searchValue", { required: false }) searchValue?: string,
  ): Promise<IHttpResult<{ comments: CommentEntity[], total: number }>> {
    const commentsResult = await this.commentService.commentListForAdmin({ current, pageSize, searchValue });

    return { code: 200, message: '', data: commentsResult };
  }

  @Authorized([9])
  @Post('/admin/audit')
  async commentAudit(
    @Ctx() ctx,
    @BodyParam('commentId') commentId: string,
    @BodyParam('passed') passed: boolean,
  ): Promise<IHttpResult<null>> {
    await this.commentService.commentAudit(commentId, passed);

    return { code: 200, message: '', data: null };
  }

  @Authorized([10])
  @Delete('/admin/delete')
  async commentDeleteForAdmin(
    @BodyParam('commentId') commentId: string,
  ): Promise<IHttpResult<null>> {
    await this.commentService.commentDeleteForAdmin(commentId);

    return { code: 200, message: '', data: null };
  }

  @Authorized()
  @Delete('/delete')
  async commentDelete(
    @Ctx() ctx,
    @Body() data: { commentId: string },
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<null>> {
    await this.commentService.commentDelete(data, user);

    return { code: 200, message: '', data: null };
  }
}