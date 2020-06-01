export interface IHttpResult<T> {
  code: number;
  message: string;
  data: T | null;
}