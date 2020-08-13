import { Inject, Service } from "typedi";
import { ArticleEntity } from "../common/schema/ArticleEntity";
import { CommentEntity, CommentType, ICommentInput, IUranusNodeType } from '../common/schema/CommentEntity';
import { NotificationEntity } from "../common/schema/NotificationEntity";
import { GoodsType, OrderCode } from "../common/schema/OrderEntity";
import { UserEntity } from '../common/schema/UserEntity';
import { ICommentEntity, IUser } from "../common/types/commom";
import ArticleModel from "../models/ArticleModel";
import CommentModel from "../models/CommentModel";
import NotificationModel from "../models/NotificationModel";
import OrderModel from "../models/OrderModel";
import UserModel from "../models/UserModel";
import WebsiteSettingsModel from "../models/WebsiteSettingsModel";

export interface ICommentListParams {
  commentType: CommentType;
  targetId: string;
  parentId: string;
  lastCommentId?: string;
}

@Service()
export default class CommentService {
  @Inject()
  private articleModel: ArticleModel;
  @Inject()
  private commentModel: CommentModel;
  @Inject()
  private notificationModel: NotificationModel;
  @Inject()
  private orderModel: OrderModel;
  @Inject()
  private userModel: UserModel;
  @Inject()
  private websiteSettingsModel: WebsiteSettingsModel;

  htmlEncode(str: string): string {
    // 防范xss攻击
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/ /g, "&nbsp;").replace(/\'/g, "&#39").replace(/\"/g, "&quot;");
  }

  async normalizeComment(data: ICommentInput): Promise<{ comment: string, users: { [userId: string]: UserEntity } }> {
    const commentStrs: string[] = [];
    const users: { [userId: string]: UserEntity } = {};
    const regexDomain = /^http:\/\/storage\.jd\.com/;
    const regexImg = /s(\d{2})\.png$/;

    const { rows } = data.content;

    if (rows.length === 0) {
      throw new Error('提交内容不能为空');
    }

    if (rows.length > 50) {
      throw new Error('提交内容超过限制');
    }

    for (let r = 0, len1 = rows.length; r < len1; r++) {
      const row = rows[r];

      // 每一行用div包裹
      commentStrs.push('<div>');
      const currentLength = commentStrs.length;
      let trimStart = true; // 去除行首空白

      if (row.length > 100) {
        throw new Error('提交内容超过限制');
      }

      for (let n = 0, len2 = row.length; n < len2; n++) {
        const node = row[n];

        switch (node.nodeType) {
          case IUranusNodeType.text:
            if (node.data.trim() !== '') {
              if (node.data.length > 500) {
                throw new Error('提交内容超过限制');
              }
              commentStrs.push(this.htmlEncode(node.data));
              trimStart = false;
            } else if (!trimStart) { // 非行首的空白
              commentStrs.push(node.data);
            }
            break;
          case IUranusNodeType.br:
            if (!trimStart) { // 非行首的换行
              commentStrs.push('<br>');
            }
            break;
          case IUranusNodeType.div:
            // 目前不支持
            break;
          case IUranusNodeType.img:
            trimStart = false;
            // 检测src合法性
            if (!node.attr || !node.attr.src || !node.attr.src.match(regexDomain)) {
              throw new Error('表情资源不合法');
            }
            const emojiNumMat = node.attr.src.match(regexImg);
            if (!emojiNumMat) {
              throw new Error('表情资源不合法');
            }
            const num = Number(emojiNumMat[1]);
            if (num < 1 || num > 72) {
              throw new Error('表情资源不合法');
            }

            commentStrs.push(`<img class="uranus-emoji" data-code="${node.attr["data-code"]}" src="${node.attr.src}">`);
            break;
          case IUranusNodeType.span:
            trimStart = false;
            if (!node.attr || !node.attr["data-id"]) {
              throw new Error('提及参数不合法');
            }

            let muser = users[node.attr["data-id"]];

            if (!muser) {
              muser = await this.userModel.findOne({ _id: node.attr["data-id"] });
            }

            if (!muser) {
              throw new Error(`提及的用户[${node.attr["data-id"]}]不存在`);
            }

            users[muser.id] = muser;
            commentStrs.push(`<span class="uranus-mention" data-id="${muser.id}" data-name="${muser.nickname}" contenteditable="false">@${muser.nickname}</span>`);
            break;
        }
      }

      if (currentLength === commentStrs.length) {
        commentStrs.pop(); // 当前行是空行，删除开始div标签
        continue;
      }

      commentStrs.push('</div>');
    }

    if (commentStrs.length === 0) {
      throw new Error('提交内容不能为空');
    }

    return { comment: commentStrs.join(''), users };
  }

  async submit(data: ICommentInput, user: IUser): Promise<CommentEntity> {
    const now = Date.now();

    if (user.isBanned && user.expires > now) {
      throw new Error('您已被禁言');
    }

    let article: ArticleEntity;
    let articleUserId: string;
    let commentUserId: string;

    if (data.commentType === CommentType.article) {
      article = await this.articleModel.findOne({ _id: data.targetId });

      if (!article) {
        throw new Error('您评论的文章不存在');
      }

      if (article.charge && article.amount > 0) {
        const orderResult = await this.orderModel.findOne({ goodsType: GoodsType.article, goodsId: article.id, userId: user.id });

        if (article.createdBy !== user.id && user.accessLevel < 8 && (!orderResult || orderResult.code !== OrderCode.success)) {
          throw new Error('您还未购买，不能评论');
        }
      }

      articleUserId = article.createdBy;

      if (data.parentId !== '0') {
        const commentRef = await this.commentModel.findOne({ _id: data.parentId });

        if (!commentRef) {
          throw new Error('您回复的评论不存在');
        }

        if (commentRef.parentId !== '0') {
          throw new Error('非法的参数'); // 评论最多嵌套一层
        }

        commentUserId = commentRef.userId;
      }

      const { comment, users } = await this.normalizeComment(data);
      const settings = await this.websiteSettingsModel.findOne({});
      const passed = settings && settings.commentReview ? false : true; // 评论审核是否开启
      const commentResult = await this.commentModel.save({
        commentType: CommentType.article,
        targetId: data.targetId,
        parentId: data.parentId,
        userId: user.id,
        userNicname: user.nickname,
        userAvatar: user.avatar,
        userAccessLevel: user.accessLevel,
        content: comment,
        passed,
        addtime: now,
      });

      if (passed) {
        // 发送通知
        const notifications: NotificationEntity[] = [];

        if (commentUserId && commentUserId !== user.id) {
          if (users[commentUserId]) {
            delete users[commentUserId]; // 不重复通知
          }

          notifications.push({
            title: '您的评论有新回复',
            desc: `${user.nickname}回复了您的评论`,
            content: `${user.nickname}回复了你: ${comment}`,
            time: now,
            userId: commentUserId,
            hasRead: false,
          });
        }

        if (articleUserId && articleUserId !== commentUserId && articleUserId !== user.id) {
          if (users[articleUserId]) {
            delete users[articleUserId]; // 不重复通知
          }

          notifications.push({
            title: '您的文章有新回复',
            desc: `${user.nickname}评论了您的文章${article.title}`,
            content: `${user.nickname}: ${comment}`,
            time: now,
            userId: articleUserId,
            hasRead: false,
          });
        }

        Object.keys(users).forEach(u => {
          if (users[u].id !== user.id) {
            notifications.push({
              title: `${user.nickname}提到了你`,
              desc: `${user.nickname}提到了你`,
              content: `${user.nickname}在文章${article.title}下面提到了你: ${comment}`,
              time: now,
              userId: users[u].id,
              hasRead: false,
            });
          }
        });

        await Promise.all(notifications.map(noti => {
          return this.notificationModel.save(noti).catch(reason => { console.error(reason.message); });
        }));
      }

      return commentResult;
    } else {
      throw new Error('不支持的类型');
    }
  }

  async commentList(params: ICommentListParams): Promise<ICommentEntity[]> {
    const { commentType, targetId, parentId, lastCommentId } = params;

    if (!commentType || !targetId || !parentId) {
      throw new Error('非法的参数');
    }

    const conditions = { commentType, targetId, parentId } as any;

    if (lastCommentId) {
      conditions._id = { $lt: lastCommentId };
    }

    const comments = await this.commentModel.findAdvanced({ conditions, limit: 10, sorter: { _id: -1 } }) as ICommentEntity[];

    if (parentId === '0') {
      const subComments = await Promise.all(comments.map(comment => {
        const conditions2 = { commentType, targetId, parentId: comment.id } as any;
        return this.commentModel.findAdvanced({ conditions: conditions2, limit: 10, sorter: { _id: -1 } });
      }));

      comments.forEach((comment, index) => {
        subComments[index].forEach(subComm => {
          if (!subComm.passed) {
            subComm.content = '';
          }
        });

        comments[index].children = subComments[index];
        if (!comment.passed) {
          comments[index].content = '';
        }
      });
    }

    return comments;
  }

  async commentListForAdmin(options: { current?: number, pageSize?: number, searchValue?: string }): Promise<{ comments: CommentEntity[], total: number }> {
    const { current, pageSize, searchValue } = options;
    const limit = pageSize ? pageSize : 15;
    const offset = current ? (current - 1) * limit : 0;
    const conditions = searchValue ? { content: { $regex: new RegExp(searchValue) } } as any : {};

    const [comments, total] = await Promise.all([
      this.commentModel.findAdvanced({ conditions, offset, limit }),
      this.commentModel.countDocuments(conditions),
    ]);

    return { comments, total };
  }

  async commentAudit(commentId: string, passed: boolean): Promise<void> {
    await this.commentModel.findOneAndUpdate({ _id: commentId }, { passed });
  }

  async commentDeleteForAdmin(commentId: string): Promise<void> {
    const comment = await this.commentModel.findOne({ _id: commentId });

    if (!comment) {
      throw new Error('该评论不存在');
    }

    await this.commentModel.deleteOne({ _id: commentId });

    if (comment.parentId === '0') {
      await this.commentModel.deleteMany({ parentId: comment.id });
    }
  }

  async count(data: { commentType: CommentType, targetId: string }): Promise<number> {
    const { commentType, targetId } = data;
    return await this.commentModel.countDocuments({ commentType, targetId });
  }

  async commentDelete(params: { commentId: string }, user: IUser): Promise<void> {
    const { commentId } = params;

    if (!commentId) {
      throw new Error('非法的参数');
    }

    const comment = await this.commentModel.findOne({ _id: commentId });

    if (!comment) {
      throw new Error('该评论不存在');
    }

    if (comment.userId !== user.id) {
      throw new Error('您只能删除自己的评论');
    }

    await this.commentModel.deleteOne({ _id: commentId });

    if (comment.parentId === '0') {
      await this.commentModel.deleteMany({ parentId: comment.id });
    }
  }
}
