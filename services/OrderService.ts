import { Inject, Service } from 'typedi';
import { GoodsType, OrderCode, OrderEntity } from '../common/schema/OrderEntity';
import { UserEntity, UserSensitiveInfo } from '../common/schema/UserEntity';
import ArticleModel from '../models/ArticleModel';
import OrderModel from '../models/OrderModel';
import WatermelonModel from '../models/WatermelonModel';
import UserModel from '../models/UserModel';
import PayService from './PayService';

@Service()
export default class OrderService {
  @Inject()
  private articleModel: ArticleModel;
  @Inject()
  private orderModel: OrderModel;
  @Inject()
  private watermelonModel: WatermelonModel;
  @Inject()
  private userModel: UserModel;

  @Inject()
  private payService: PayService;

  async generateOrder(data: { goodsType: GoodsType, goodsId: string }, user: UserEntity): Promise<OrderEntity> {
    const { goodsType, goodsId } = data;
    const { id: userId } = user;
    const now = Date.now();
    let price = 0;
    let sellerId = '';
    let remark = '';

    switch (goodsType) {
      case GoodsType.article:
        const article = await this.articleModel.findOne({ _id: goodsId });

        if (!article) {
          throw new Error('不存在的文章');
        }

        if (!article.charge || article.amount <= 0) {
          throw new Error('该文章可以免费阅读');
        }

        sellerId = article.createdBy;
        price = article.amount * 100; // 单位：分
        remark = article.title;
        break;
      case GoodsType.watermelon:
        const watermelon = await this.watermelonModel.findOne({ _id: goodsId });

        if (!watermelon) {
          throw new Error('不存在的游戏路径');
        }

        sellerId = '5f5c72771fbd97001c723ffd'; // 管理员
        price = watermelon.amount * 100; // 单位：分
        remark = watermelon.path;
        break;
      default:
        throw new Error('无效的商品类别');
    }

    const orderSucceed = await this.orderModel.findOne({ goodsType, goodsId, buyerId: userId, code: OrderCode.success });

    if (orderSucceed) {
      throw new Error('该订单您已经支付过了');
    }

    const order: OrderEntity = {
      goodsType,
      goodsId,
      totalPrice: price,
      sellerId,
      buyerId: userId,
      remark,
      code: OrderCode.init,
      status: '未支付',
      createTime: now,
    };

    return await this.orderModel.save(order);
  }

  async getOrders(options: { current?: number, pageSize?: number, searchValue?: string }, filter: Partial<OrderEntity>): Promise<{ orders: OrderEntity[], total: number }> {
    const { current, pageSize, searchValue } = options;
    const limit = pageSize ? pageSize : 15;
    const offset = current ? (current - 1) * limit : 0;
    const sorter = { _id: -1 };
    const conditions = searchValue ? { ...filter, remark: { $regex: new RegExp(searchValue) } } as any : { ...filter };

    const [orders, total] = await Promise.all([
      this.orderModel.findAdvanced({ conditions, offset, limit, sorter }),
      this.orderModel.countDocuments(conditions),
    ]);

    return { orders, total };
  }

  async receivables(options: { current?: number, pageSize?: number, searchValue?: string }, user: UserEntity): Promise<{ orders: OrderEntity[], total: number }> {
    const filter = { sellerId: user.id, code: OrderCode.success, settled: false };
    return await this.getOrders(options, filter);
  }

  async mine(options: { current?: number, pageSize?: number, searchValue?: string }, user: UserEntity): Promise<{ orders: OrderEntity[], total: number }> {
    const filter = { buyerId: user.id, code: { $in: [OrderCode.success, OrderCode.failure, OrderCode.refunding, OrderCode.refunded, OrderCode.refund_fail] } } as any;
    return await this.getOrders(options, filter);
  }

  async getOrdersForAdmin(options: { current?: number, pageSize?: number, searchValue?: string }, user: UserEntity): Promise<{ orders: OrderEntity[], users: UserEntity[], total: number }> {
    const filter = {};
    const { orders, total } = await this.getOrders(options, filter);
    const userMap: { [userId: string]: boolean } = {};
    let users: UserEntity[] = [];

    orders.forEach(order => {
      userMap[order.buyerId] = true;
      userMap[order.sellerId] = true;
    });

    const userIds = Object.keys(userMap);

    if (userIds.length) {
      users = await this.userModel.find({ _id: { $in: userIds } } as any, UserSensitiveInfo);
    }

    return { orders, users, total };
  }

  async orderRefundForAdmin(orderId: string): Promise<void> {
    const order = await this.orderModel.findOne({ _id: orderId });

    if (!order) {
      throw new Error('不存在的订单');
    }

    if (order.code === OrderCode.init) {
      throw new Error('订单未支付');
    }

    if (order.code === OrderCode.failure) {
      throw new Error('订单支付失败');
    }

    if (order.code === OrderCode.refunding) {
      throw new Error('订单退款中，请勿重复操作');
    }

    if (order.code === OrderCode.refunded) {
      throw new Error('订单已经退款了');
    }

    await this.payService.refund(orderId);
  }
}