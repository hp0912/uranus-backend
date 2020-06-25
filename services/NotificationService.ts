import { Inject, Service } from 'typedi';
import { NotificationEntity } from '../common/schema/NotificationEntity';
import { IUser } from '../common/types/commom';
import NotificationModel from '../models/NotificationModel';
import UserModel from '../models/UserModel';

@Service()
export default class NotificationService {
  @Inject()
  private notificationModel: NotificationModel;
  @Inject()
  private userModel: UserModel;

  async notificationCount(user: IUser): Promise<number> {
    return this.notificationModel.countDocuments({ userId: user.id, hasRead: false });
  }

  async notificationList(lastNotiId: string, user: IUser): Promise<NotificationEntity[]> {
    const conditions = { userId: user.id, hasRead: false } as any;

    if (lastNotiId) {
      conditions._id = { $gt: lastNotiId };
    }

    return this.notificationModel.findAdvanced({ conditions, limit: 3, sorter: { _id: 1 } });
  }

  async notificationAll(lastNotiId: string, user: IUser): Promise<NotificationEntity[]> {
    const conditions = { userId: user.id } as any;

    if (lastNotiId) {
      conditions._id = { $gt: lastNotiId };
    }

    return this.notificationModel.findAdvanced({ conditions, limit: 3, sorter: { _id: 1 } });
  }

  async markAsRead(notification: NotificationEntity): Promise<void> {
    await this.notificationModel.findOneAndUpdate({ _id: notification.id }, { hasRead: true });
  }

  async markAsReadForAll(user: IUser): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: user.id, hasRead: false },
      { hasRead: true },
    );
  }

  async sendNotification(data: { notification: NotificationEntity, broadcast: boolean }): Promise<void> {
    const { notification, broadcast } = data;
    const { userId, title, desc, content } = notification;
    const now = Date.now();
    const insertData = {
      title,
      desc,
      content,
      time: now,
      userId,
      hasRead: false,
    };

    if (!broadcast) {
      await this.notificationModel.save(insertData);
    } else {
      const users = await this.userModel.find({});
      const insertDatas: NotificationEntity[] = users.map(user => {
        return Object.assign({}, insertData, { userId: user.id });
      });

      await this.notificationModel.insertMany(insertDatas);
    }
  }
}