import { index, prop } from '@typegoose/typegoose';

export enum CommentType {
  article = 'article',
}

@index({ commentType: 1, targetId: 1, parentId: 1 }, { unique: false })
@index({ userId: 1 }, { unique: false })
export class CommentEntity {
  _id?: string;

  id?: string;

  @prop({ required: true, enum: CommentType })
  commentType?: CommentType;

  @prop({ required: true }) // 文章或其他板块
  targetId?: string;

  @prop({ required: true }) // 评论父级内容，评论的是文章/文章的某条评论
  parentId?: string;

  @prop({ required: true }) // 评论者
  userId?: string;

  @prop({ required: true })
  userNicname?: string;

  @prop({ required: true })
  userAvatar?: string;

  @prop({ required: true })
  userAccessLevel?: number;

  @prop({ required: true }) // 评论内容
  content?: string;

  @prop({ required: true }) // 评论状态，审核通过/未通过
  passed?: boolean;

  @prop({ required: true }) // 评论时间
  addtime?: number;
}

export enum IUranusNodeType {
  div = 'div',
  img = 'img',
  span = 'span',
  text = 'text',
  br = 'br',
}

export interface IUranusNode {
  nodeType: IUranusNodeType;
  data?: string;
  attr?: {
    src?: string;
    'data-id'?: string;
    'data-code'?: string;
  };
}

export interface ICommentInput {
  commentType: CommentType;
  targetId: string;
  parentId: string;
  content: { rows: IUranusNode[][] };
}
