import { Authorized, Body, Ctx, Get, JsonController, Post } from "routing-controllers";
import { Inject, Service } from "typedi";
import { WebsiteSettingsEntity } from "../common/schema/WebsiteSettingsEntity";
import { IHttpResult } from "../common/types/commom";
import WebsiteSettingsService from "../services/WebsiteSettingsService";

@JsonController('/websiteSettings')
@Service()
export class WebsiteSettingsController {
  @Inject()
  private websiteSettingsService: WebsiteSettingsService;

  @Get('/motto')
  async motto(
    @Ctx() ctx,
  ): Promise<IHttpResult<string>> {
    const motto = await this.websiteSettingsService.motto();

    return { code: 200, message: '', data: motto };
  }

  @Get('/advertisement')
  async advertisement(
    @Ctx() ctx,
  ): Promise<IHttpResult<string>> {
    const advertisement = await this.websiteSettingsService.advertisement();

    return { code: 200, message: '', data: advertisement };
  }

  @Authorized([10])
  @Get('/show')
  async show(
    @Ctx() ctx,
  ): Promise<IHttpResult<WebsiteSettingsEntity>> {
    const settings = await this.websiteSettingsService.show();

    return { code: 200, message: '', data: settings };
  }

  @Authorized([10])
  @Post('/update')
  async update(
    @Ctx() ctx,
    @Body() data: WebsiteSettingsEntity,
  ): Promise<IHttpResult<WebsiteSettingsEntity>> {
    const result = await this.websiteSettingsService.update(data);

    return { code: 200, message: '', data: result };
  }

}