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
    let remark = '';

    switch (goodsType) {
      case GoodsType.article:
        const [article, articleOrder] = await Promise.all([
          this.articleModel.findOne({ _id: goodsId }),
          this.orderModel.findOne({ goodsType, goodsId, userId }),
        ]);

        if (!article) {
          throw new Error('不存在的文章');
        }

        if (!article.charge || article.amount <= 0) {
          throw new Error('该文章可以免费阅读');
        }

        if (articleOrder && articleOrder.code === OrderCode.success) {
          throw new Error('该文章您已经支付过了');
        }

        price = article.amount * 100; // 单位：分
        remark = `知识付费: ${article.title}`;
        break;
      default:
        throw new Error('无效的商品类别');
    }

    await this.orderModel.deleteMany({ goodsType, goodsId, userId });

    const order: OrderEntity = {
      goodsType,
      goodsId,
      totalPrice: price,
      userId,
      remark,
      code: OrderCode.init,
      status: '未支付',
      createTime: now,
    };

    return await this.orderModel.save(order);
  }
}