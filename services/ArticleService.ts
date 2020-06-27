import { Inject, Service } from 'typedi';
import { ArticleEntity, AuditStatus, ShareWith } from '../common/schema/ArticleEntity';
import { UserEntity } from '../common/schema/UserEntity';
import ArticleModel from '../models/ArticleModel';
import AutnService from './AutnService';

@Service()
export default class ArticleService {
  @Inject()
  private articleModel: ArticleModel;

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

  async articleList(): Promise<ArticleEntity[]> {
    return await this.articleModel.find({});
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