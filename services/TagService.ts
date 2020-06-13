import { Inject, Service } from 'typedi';
import { TagEntity } from '../common/schema/TagEntity';
import { UserEntity } from '../common/schema/UserEntity';
import TagModel from '../models/TagModel';

@Service()
export default class TagService {
  @Inject()
  private tagModel: TagModel;

  async tagList(): Promise<TagEntity[]> {
    return await this.tagModel.find({});
  }

  async tagSave(data: TagEntity, user: UserEntity): Promise<TagEntity[]> {
    if (data.name === undefined || data.name === undefined || data.name === '') {
      throw new Error('标签名不合法');
    }

    if (data.name.length > 30) {
      throw new Error('标签名长度不能超过30个字符');
    }

    if (!Number.isInteger(data.index)) {
      throw new Error('标签排序不合法');
    }

    if (!data.color || !data.color.match(/^#[0-9a-fA-F]{3,6}$/)) {
      throw new Error('标签颜色不合法');
    }

    const now = Date.now();

    if (!data.id) {
      data.addBy = user.id;
      data.addTime = now;
      data.updateBy = user.id;
      data.updateTime = now;

      await this.tagModel.save(data);
    } else {
      data.updateBy = user.id;
      data.updateTime = now;
      const _id = data.id;
      delete data.id;

      await this.tagModel.findOneAndUpdate({ _id }, data);
    }

    return await this.tagModel.find({});
  }

  async tagDelete(id: string): Promise<TagEntity[]> {
    await this.tagModel.deleteOne({ _id: id });
    return await this.tagModel.find({});
  }
}