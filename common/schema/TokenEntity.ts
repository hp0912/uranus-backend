import { index, prop } from '@typegoose/typegoose';

export enum TokenType {
  article = 'article',
}

@index({ tokenType: 1, targetId: 1 }, { unique: true })
export class TokenEntity {
  _id?: string;

  id?: string;

  @prop({ required: true, enum: TokenType })
  tokenType?: TokenType;

  @prop({ required: true })
  targetId?: string;

  @prop({ required: true })
  expires?: number;
}
