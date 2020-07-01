import { Authorized, Body, BodyParam, Ctx, CurrentUser, Delete, Get, JsonController, Post, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import { ArticleEntity, AuditStatus } from "../common/schema/ArticleEntity";
import { TagEntity } from "../common/schema/TagEntity";
import { UserEntity } from "../common/schema/UserEntity";
import { IHttpResult, IUser } from "../common/types/commom";
import ArticleService from "../services/ArticleService";

@JsonController('/article')
@Service()
export class ArticleController {
  @Inject()
  private articleService: ArticleService;

  @Get('/get')
  async articleGet(
    @Ctx() ctx,
    @QueryParam('articleId') articleId: string,
  ): Promise<IHttpResult<ArticleEntity>> {
    const article = await this.articleService.articleGet(ctx, articleId);

    return { code: 200, message: '', data: article };
  }

  @Get('/list')
  async articleList(
    @Ctx() ctx,
    @QueryParam("current", { required: false }) current?: number,
    @QueryParam("pageSize", { required: false }) pageSize?: number,
    @QueryParam("searchValue", { required: false }) searchValue?: string,
  ): Promise<IHttpResult<{ articles: ArticleEntity[], users: UserEntity[], tags: TagEntity[], total: number }>> {
    const articlesResult = await this.articleService.articleList(ctx, { current, pageSize, searchValue });

    return { code: 200, message: '', data: articlesResult };
  }

  // 管理员专用
  @Authorized([8])
  @Get('/admin/list')
  async articleListForAdmin(
    @Ctx() ctx,
    @QueryParam("current", { required: false }) current?: number,
    @QueryParam("pageSize", { required: false }) pageSize?: number,
    @QueryParam("searchValue", { required: false }) searchValue?: string,
  ): Promise<IHttpResult<{ articles: ArticleEntity[], users: UserEntity[], total: number }>> {
    const articlesResult = await this.articleService.articleListForAdmin({ current, pageSize, searchValue });

    return { code: 200, message: '', data: articlesResult };
  }

  @Authorized([9])
  @Post('/admin/audit')
  async articleAudit(
    @BodyParam('articleId') articleId: string,
    @BodyParam('auditStatus') auditStatus: AuditStatus,
  ): Promise<IHttpResult<null>> {
    await this.articleService.articleAudit(articleId, auditStatus);

    return { code: 200, message: '', data: null };
  }

  @Authorized([10])
  @Delete('/admin/delete')
  async articleDeleteForAdmin(
    @BodyParam('articleId') articleId: string,
  ): Promise<IHttpResult<null>> {
    await this.articleService.articleDeleteForAdmin(articleId);

    return { code: 200, message: '', data: null };
  }

  @Authorized()
  @Post('/save')
  async articleSave(
    @Ctx() ctx,
    @Body() data: ArticleEntity,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<ArticleEntity>> {
    const articles = await this.articleService.articleSave(data, user);

    return { code: 200, message: '', data: articles };
  }

  @Authorized()
  @Delete('/delete')
  async articleDelete(
    @Ctx() ctx,
    @Body() data: { id: string },
  ): Promise<IHttpResult<ArticleEntity[]>> {
    const articles = await this.articleService.articleDelete(data.id);

    return { code: 200, message: '', data: articles };
  }

}