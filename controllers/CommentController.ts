import { Authorized, Body, Ctx, CurrentUser, JsonController, Post } from "routing-controllers";
import { Inject, Service } from "typedi";
import { CommentEntity, ICommentInput } from "../common/schema/CommentEntity";
import { IHttpResult, IUser } from "../common/types/commom";
import CommentService from "../services/CommentService";

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

}