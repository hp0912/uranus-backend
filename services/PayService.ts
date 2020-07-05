import { Inject, Service } from 'typedi';
import { IPayData, IUser } from '../common/types/commom';
import PayModel from '../models/PayModel';

@Service()
export default class PayService {
  @Inject()
  private payModel: PayModel;

  async pay(data: {}, user: IUser): Promise<IPayData> {
    this.payModel.findOne({});
    return
  }
}