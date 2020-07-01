import { Inject, Service } from 'typedi';
import { ArticleEntity, AuditStatus, ShareWith } from '../common/schema/ArticleEntity';
import { TagEntity } from '../common/schema/TagEntity';
import { UserEntity } from '../common/schema/UserEntity';
import ArticleModel from '../models/ArticleModel';
import TagModel from '../models/TagModel';
import UserModel from '../models/UserModel';
import AutnService from './AutnService';

@Service()
export default class ArticleService {
  @Inject()
  private articleModel: ArticleModel;
  @Inject()
  private tagModel: TagModel;
  @Inject()
  private userModel: UserModel;

  @Inject()
  autnService: AutnService;

  async articleGet(ctx, articleId: string): Promise<ArticleEntity> {
    if (!articleId) {
      throw new Error('参数不合法');
    }

    const [article, user] = await Promise.all([
      this.articleModel.findOne({ _id: articleId }),
      this.autnService.checkLogin(ctx),
    ]);

    if (!article) {
      throw new Error('该文章不存在');
    }

    if (user && user.accessLevel >= 8) {
      return article;
    }

    if (article.shareWith === ShareWith.private && (!user || user.id !== article.createdBy)) {
      throw new Error('应作者版权要求, 该文章仅作者自己可见');
    }

    if (!article.charge) {
      return article;
    } else {
      if (!user) {
        throw new Error('应作者版权要求, 该文章需付费阅读, 请先登录');
      }

      if (user.id === article.createdBy) {
        return article;
      } else {
        return article;
      }
    }
  }

  async articleList(ctx, options: { current?: number, pageSize?: number, searchValue?: string }): Promise<{ articles: ArticleEntity[], users: UserEntity[], tags: TagEntity[], total: number }> {
    const { current, pageSize, searchValue } = options;
    const limit = pageSize ? pageSize : 15;
    const offset = current ? (current - 1) * limit : 0;
    const select = { content: 0 };
    let conditions = searchValue ? { $or: [{ title: { $regex: new RegExp(searchValue) } }, { desc: { $regex: new RegExp(searchValue) } }] } as any : {};

    const currentUser = await this.autnService.checkLogin(ctx);

    if (!currentUser) {
      conditions.shareWith = ShareWith.public;
    } else if (currentUser.accessLevel < 8) {
      const subConditions = searchValue ? { $or: [{ title: { $regex: new RegExp(searchValue) } }, { desc: { $regex: new RegExp(searchValue) } }] } as any : {};
      conditions = {
        $and: [
          {
            $or: [
              { shareWith: ShareWith.public },
              { shareWith: ShareWith.private, createdBy: currentUser.id },
            ],
          },
          subConditions,
        ],
      };
    }

    const [articles, total] = await Promise.all([
      this.articleModel.findAdvanced({ conditions, offset, limit, select }),
      this.articleModel.countDocuments(conditions),
    ]);

    const tasks = [];
    const userIds = articles.map(item => item.createdBy);
    const tagIds: string[] = [];
    articles.forEach(item => {
      tagIds.push(...item.tags);
    });

    if (userIds.length) {
      tasks.push(this.userModel.find({ _id: { $in: userIds } as any }));
    } else {
      tasks.push(Promise.resolve([]));
    }

    if (tagIds.length) {
      tasks.push(this.tagModel.find({ _id: { $in: tagIds } as any }));
    } else {
      tasks.push(Promise.resolve([]));
    }

    const [users, tags] = await Promise.all(tasks);

    return { articles, users, tags, total };
  }

  async articleListForAdmin(options: { current?: number, pageSize?: number, searchValue?: string }): Promise<{ articles: ArticleEntity[], users: UserEntity[], total: number }> {
    const { current, pageSize, searchValue } = options;
    const limit = pageSize ? pageSize : 15;
    const offset = current ? (current - 1) * limit : 0;
    const conditions = searchValue ? { $or: [{ title: { $regex: new RegExp(searchValue) } }, { desc: { $regex: new RegExp(searchValue) } }] } as any : {};
    const select = { content: 0 };

    const [articles, total] = await Promise.all([
      this.articleModel.findAdvanced({ conditions, offset, limit, select }),
      this.articleModel.countDocuments(conditions),
    ]);

    const userIds = articles.map(item => item.createdBy);

    if (userIds.length === 0) {
      return { articles, users: [], total };
    }

    const users = await this.userModel.find({ _id: { $in: userIds } as any });
    return { articles, users, total };
  }

  async articleAudit(articleId: string, auditStatus: AuditStatus): Promise<void> {
    await this.articleModel.findOneAndUpdate({ _id: articleId }, { auditStatus });
  }

  async articleDeleteForAdmin(articleId: string): Promise<void> {
    await this.articleModel.deleteOne({ _id: articleId });
  }

  async articleSave(data: ArticleEntity, user: UserEntity): Promise<ArticleEntity> {
    const { id, title, coverPicture, tags, desc, content, charge, shareWith } = data;
    let { amount } = data;
    let auditStatus: AuditStatus = AuditStatus.unapprove;
    let saveResult: ArticleEntity;

    if (title === '' || content === '') {
      throw new Error('文章标题、内容不能为空');
    }

    if (title.length > 50) {
      throw new Error('文章标题过长');
    }

    if (!coverPicture) {
      throw new Error('文章封面不能为空');
    } else if (!coverPicture.match(/\.(?:jpeg|jpg|png|webp|bmp|gif|svg)$/)) {
      throw new Error('文章封面格式不合法');
    }

    if (!charge) {
      amount = 0;
    } else if (amount <= 0 || Number.isNaN(Number(amount))) {
      throw new Error('支付金额必须是大于0的合法数字');
    }

    if (shareWith === ShareWith.public) {
      if (user.accessLevel >= 7) {
        auditStatus = AuditStatus.approved;
      } else {
        auditStatus = AuditStatus.unapprove;
      }
    } else if (shareWith === ShareWith.private) {
      auditStatus = AuditStatus.approved;
    } else {
      throw new Error('参数不合法');
    }

    const now = Date.now();

    if (id === 'new') {
      saveResult = await this.articleModel.save({ title, coverPicture, tags, desc, content, charge, amount, shareWith, auditStatus, createdBy: user.id, createdTime: now, modifyBy: user.id, modifyTime: now });
    } else {
      const history = await this.articleModel.findOne({ _id: id });

      if (!history) {
        throw new Error('参数不合法');
      }

      if (user.id !== history.createdBy && user.accessLevel < 8) {
        throw new Error('非法的请求');
      }

      saveResult = await this.articleModel.findOneAndUpdate({ _id: id }, { title, coverPicture, tags, desc, content, charge, amount, shareWith, auditStatus, modifyBy: user.id, modifyTime: now });
    }

    return saveResult;
  }

  async articleDelete(id: string): Promise<ArticleEntity[]> {
    await this.articleModel.deleteOne({ _id: id });
    return await this.articleModel.find({});
  }
}