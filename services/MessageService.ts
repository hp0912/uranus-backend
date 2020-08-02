import { Inject, Service } from "typedi";
import { MessageEntity } from "../common/schema/MessageEntity";
import MessageModel from "../models/MessageModel";
import AutnService from "./AutnService";

@Service()
export default class MessageService {
  @Inject()
  private messageModel: MessageModel;
  @Inject()
  private autnService: AutnService;

  async messageSubmit(ctx, data: { message: string }): Promise<MessageEntity> {
    const currentUser = await this.autnService.checkLogin(ctx);
    const now = Date.now();
    const message = data.message.trim();

    if (message === '') {
      throw new Error('留言内容不能为空');
    }

    if (message.length > 50) {
      throw new Error('留言内容不能超过50个字');
    }

    if (currentUser) {
      const { id, nickname, accessLevel, avatar } = currentUser;
      return await this.messageModel.save({
        userId: id,
        userNicname: nickname,
        userAvatar: avatar,
        userAccessLevel: accessLevel,
        content: message,
        addtime: now,
      });
    } else {
      return await this.messageModel.save({
        userId: '0000000000000000',
        userNicname: '未知的火星网友',
        userAvatar: 'https://img.houhoukang.com/uranus/system/default-avatar.png',
        userAccessLevel: 1,
        content: message,
        addtime: now,
      });
    }
  }

  async count(): Promise<number> {
    return await this.messageModel.countDocuments({});
  }

  async messageList(params: { lastMessageId: string }): Promise<MessageEntity[]> {
    const { lastMessageId } = params;

    const conditions = {} as any;

    if (lastMessageId) {
      conditions._id = { $gt: lastMessageId };
    }

    const messages = await this.messageModel.findAdvanced({ conditions, limit: 30, sorter: { _id: 1 } }) as MessageEntity[];

    return messages;
  }

  async messageListForAdmin(options: { current?: number, pageSize?: number, searchValue?: string }): Promise<{ comments: MessageEntity[], total: number }> {
    const { current, pageSize, searchValue } = options;
    const limit = pageSize ? pageSize : 15;
    const offset = current ? (current - 1) * limit : 0;
    const conditions = searchValue ? { content: { $regex: new RegExp(searchValue) } } as any : {};

    const [comments, total] = await Promise.all([
      this.messageModel.findAdvanced({ conditions, offset, limit }),
      this.messageModel.countDocuments(conditions),
    ]);

    return { comments, total };
  }

  async delete(data: { messageId: string }): Promise<void> {
    await this.messageModel.deleteOne({ _id: data.messageId });
  }
}
