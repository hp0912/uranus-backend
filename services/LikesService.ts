import { Inject, Service } from "typedi";
import { LikesType } from "../common/schema/LikesEntity";
import { IUser } from "../common/types/commom";
import ArticleModel from "../models/ArticleModel";
import LikesModel from "../models/LikesModel";
import NotificationModel from "../models/NotificationModel";
import AutnService from "./AutnService";

@Service()
export default class LikesService {
  @Inject()
  private likesModel: LikesModel;
  @Inject()
  private articleModel: ArticleModel;
  @Inject()
  private notificationModel: NotificationModel;
  @Inject()
  private autnService: AutnService;

  async like(data: { likesType: LikesType, targetId: string }, user: IUser): Promise<number> {
    const { likesType, targetId } = data;
    const now = Date.now();

    switch (likesType) {
      case LikesType.article:
        const article = await this.articleModel.findOne({ _id: targetId });
        if (!article) {
          throw new Error('点赞的文章不存在');
        }

        if (article.createdBy !== user.id) { // 点赞自己的文章不发送通知
          this.notificationModel.save({
            title: `${user.nickname}赞了你的文章`,
            desc: `${user.nickname}赞了你的文章`,
            content: `${user.nickname}赞了你的文章${article.title}`,
            time: now,
            userId: article.createdBy,
            hasRead: false,
          }).catch(reason => {
            console.error(reason.message);
          });
        }
        break;
      default:
        throw new Error('不支持的类型');
    }

    await this.likesModel.findOneAndUpdate(
      { likesType, targetId, userId: user.id },
      { likesType, targetId, userId: user.id, addtime: now },
      { upsert: true },
    );

    return await this.likesModel.countDocuments({ likesType, targetId });
  }

  async liked(ctx, likesType: LikesType, targetId: string): Promise<boolean> {
    const user = await this.autnService.checkLogin(ctx);

    if (user) {
      const liked = await this.likesModel.findOne({ likesType, targetId, userId: user.id });
      return !!liked;
    }

    return false;
  }

  async count(data: { likesType: LikesType, targetId: string }): Promise<number> {
    const { likesType, targetId } = data;
    return await this.likesModel.countDocuments({ likesType, targetId });
  }

  async cancel(data: { likesType: LikesType, targetId: string }, user: IUser): Promise<number> {
    const { likesType, targetId } = data;
    await this.likesModel.deleteOne({ likesType, targetId, userId: user.id });
    return await this.likesModel.countDocuments({ likesType, targetId });
  }
}
