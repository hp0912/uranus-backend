import { Inject, Service } from 'typedi';
import { TokenEntity, TokenType } from '../common/schema/TokenEntity';
import { IUser } from '../common/types/commom';
import ArticleModel from '../models/ArticleModel';
import TokenModel from '../models/TokenModel';

@Service()
export default class TokenService {
  @Inject()
  private tokenModel: TokenModel;
  @Inject()
  private articleModel: ArticleModel;

  async getToken(data: { tokenType: TokenType, targetId: string }, user: IUser): Promise<TokenEntity> {
    await this.auth(data, user);

    const { tokenType, targetId } = data;
    const token = await this.tokenModel.findOne({ tokenType, targetId });

    if (token) {
      return token;
    } else {
      const expires = new Date();
      expires.setTime(expires.getTime() + 7 * 86400 * 1000);
      return await this.tokenModel.save({ tokenType, targetId, expires: expires.getTime() });
    }
  }

  async updateToken(data: { tokenType: TokenType, targetId: string }, user: IUser): Promise<TokenEntity> {
    await this.auth(data, user);

    const { tokenType, targetId } = data;

    await this.tokenModel.deleteOne(data);

    const expires = new Date();
    expires.setTime(expires.getTime() + 7 * 86400 * 1000);
    return await this.tokenModel.save({ tokenType, targetId, expires: expires.getTime() });
  }

  private async auth(data: { tokenType: TokenType, targetId: string }, user: IUser): Promise<void> {
    const { tokenType, targetId } = data;

    switch (tokenType) {
      case TokenType.article:
        const article = await this.articleModel.findOne({ _id: targetId });
        if (!article) {
          throw new Error('文章不存在');
        }

        if (article.createdBy !== user.id && user.accessLevel < 8) {
          throw new Error('只能获取自己的文章的token');
        }
        break;
      default:
        throw new Error('非法的参数');
    }
  }
}