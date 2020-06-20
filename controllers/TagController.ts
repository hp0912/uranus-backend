import { Authorized, Body, Ctx, CurrentUser, Delete, Get, JsonController, Post } from "routing-controllers";
import { Inject, Service } from "typedi";
import { TagEntity } from "../common/schema/TagEntity";
import { IHttpResult, IUser } from "../common/types/commom";
import TagService from "../services/TagService";

@JsonController('/tag')
@Service()
export class TagController {
  @Inject()
  private tagService: TagService;

  @Get('/tagList')
  async tagList(
    @Ctx() ctx,
  ): Promise<IHttpResult<TagEntity[]>> {
    const tags = await this.tagService.tagList();

    return { code: 200, message: '', data: tags };
  }

  // 需要权限等级6以及以上的权限才能保存tag
  @Authorized([6])
  @Post('/tagSave')
  async tagSave(
    @Ctx() ctx,
    @Body() data: TagEntity,
    @CurrentUser() user?: IUser,
  ): Promise<IHttpResult<TagEntity[]>> {
    const tags = await this.tagService.tagSave(data, user);

    return { code: 200, message: '', data: tags };
  }

  // 只有系统管理员才能删tag
  @Authorized([10])
  @Delete('/tagDelete')
  async tagDelete(
    @Ctx() ctx,
    @Body() data: { id: string },
  ): Promise<IHttpResult<TagEntity[]>> {
    const tags = await this.tagService.tagDelete(data.id);

    return { code: 200, message: '', data: tags };
  }

}