import { Inject, Service } from "typedi";
import { ArticleEntity } from "../common/schema/ArticleEntity";
import { CommentEntity, CommentType, ICommentInput, IUranusNodeType } from '../common/schema/CommentEntity';
import { NotificationEntity } from "../common/schema/NotificationEntity";
import { UserEntity } from '../common/schema/UserEntity';
import { IUser } from "../common/types/commom";
import ArticleModel from "../models/ArticleModel";
import CommentModel from "../models/CommentModel";
import NotificationModel from "../models/NotificationModel";
import UserModel from "../models/UserModel";

@Service()
export default class CommentService {
  @Inject()
  private articleModel: ArticleModel;
  @Inject()
  private commentModel: CommentModel;
  @Inject()
  private notificationModel: NotificationModel;
  @Inject()
  private userModel: UserModel;

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

      articleUserId = article.createdBy;

      if (data.parentId !== '0') {
        const commentRef = await this.commentModel.findOne({ _id: data.parentId });

        if (!commentRef) {
          throw new Error('您回复的评论不存在');
        }

        commentUserId = commentRef.userId;
      }

      const { comment, users } = await this.normalizeComment(data);
      const commentResult = await this.commentModel.save({
        commentType: CommentType.article,
        targetId: data.targetId,
        parentId: data.parentId,
        userId: user.id,
        userNicname: user.nickname,
        userAvatar: user.avatar,
        content: comment,
        passed: true,
        addtime: now,
      });

      // 发送通知
      const notifications: NotificationEntity[] = [];
      let currentUser: UserEntity;

      if (commentUserId && commentUserId !== user.id) {
        if (users[commentUserId]) {
          currentUser = users[commentUserId];
          delete users[commentUserId]; // 不重复通知
        } else {
          currentUser = await this.userModel.findOne({ _id: commentUserId });
        }

        notifications.push({
          title: '您的评论有新回复',
          desc: `${currentUser.nickname}回复了您的评论`,
          content: `${currentUser.nickname}回复了你: ${comment}`,
          time: now,
          userId: commentUserId,
          hasRead: false,
        });
      }

      if (articleUserId && articleUserId !== commentUserId && articleUserId !== user.id) {
        if (users[articleUserId]) {
          currentUser = users[articleUserId];
          delete users[articleUserId]; // 不重复通知
        } else {
          currentUser = await this.userModel.findOne({ _id: articleUserId });
        }

        notifications.push({
          title: '您的文章有新回复',
          desc: `${currentUser.nickname}评论了您的文章${article.title}`,
          content: `${currentUser.nickname}: ${comment}`,
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

      return commentResult;
    } else {
      throw new Error('不支持的类型');
    }
  }
}
