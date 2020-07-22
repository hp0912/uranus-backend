import { index, prop } from '@typegoose/typegoose';

export enum TokenType {
  article = 'article',
}

@index({ _id: 1, tokenType: 1, targetId: 1 }, { unique: false })
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
