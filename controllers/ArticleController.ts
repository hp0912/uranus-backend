import { Authorized, Body, Ctx, CurrentUser, Delete, Get, JsonController, Post, QueryParam } from "routing-controllers";
import { Inject, Service } from "typedi";
import { ArticleEntity } from "../common/schema/ArticleEntity";
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
  ): Promise<IHttpResult<ArticleEntity[]>> {
    const articles = await this.articleService.articleList();

    return { code: 200, message: '', data: articles };
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