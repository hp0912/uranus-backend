import { Inject, Service } from 'typedi';
import { GoodsType, OrderCode, OrderEntity } from '../common/schema/OrderEntity';
import { UserEntity } from '../common/schema/UserEntity';
import ArticleModel from '../models/ArticleModel';
import OrderModel from '../models/OrderModel';

@Service()
export default class OrderService {
  @Inject()
  private articleModel: ArticleModel;
  @Inject()
  private orderModel: OrderModel;

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
      default:
        throw new Error('无效的商品类别');
    }

    const orderSucceed = await this.orderModel.findOne({ goodsType, goodsId, buyerId: userId, code: OrderCode.success });

    if (orderSucceed) {
      throw new Error('该文章您已经支付过了');
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
    return this.getOrders(options, filter);
  }

  async mine(options: { current?: number, pageSize?: number, searchValue?: string }, user: UserEntity): Promise<{ orders: OrderEntity[], total: number }> {
    const filter = { buyerId: user.id, code: { $in: [OrderCode.success, OrderCode.failure, OrderCode.refund] } } as any;
    return this.getOrders(options, filter);
  }
}