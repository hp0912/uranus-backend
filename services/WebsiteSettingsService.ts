import { Inject, Service } from 'typedi';
import { WebsiteSettingsEntity } from '../common/schema/WebsiteSettingsEntity';
import WebsiteSettingsModel from '../models/WebsiteSettingsModel';

@Service()
export default class WebsiteSettingsService {
  @Inject()
  private websiteSettingsModel: WebsiteSettingsModel;

  async motto(): Promise<string> {
    const result = await this.websiteSettingsModel.findOne({});
    return result.motto;
  }

  async advertisement(): Promise<string> {
    const result = await this.websiteSettingsModel.findOne({});
    return result.advertisement;
  }

  async show(): Promise<WebsiteSettingsEntity> {
    return await this.websiteSettingsModel.findOne({});
  }

  async update(data: WebsiteSettingsEntity): Promise<WebsiteSettingsEntity> {
    if (!data.motto || !data.advertisement) {
      throw new Error('参数不合法');
    }

    const { id, ...updateData } = data;
    const result = await this.websiteSettingsModel.findOneAndUpdate({ _id: id }, updateData);

    if (!result) {
      return await this.websiteSettingsModel.save(updateData);
    } else {
      return result;
    }
  }
}