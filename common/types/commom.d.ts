export interface IHttpResult<T> {
  code: number;
  message: string;
  data: T | null;
}

export interface IUser {
  id?: string;
  username: string;
  nickname: string;
  avatar: string;
  accessLevel: number;
  signature?: string;
  personalProfile?: string;
  activated?: boolean;
  registerTime?: number;
}