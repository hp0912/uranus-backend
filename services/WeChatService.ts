import sha1 from 'sha1';
import { Service } from "typedi";
import config from '../config';

interface IWeChatMessageParams {
  signature: string;
  timestamp: string;
  nonce: string;
  echostr: string;
}

@Service()
export default class WeChatService {

  async weChatMessage(params: IWeChatMessageParams): Promise<string> {
    const { echostr } = params;
    const auth = this.weChatAuth(params);

    if (auth) {
      return echostr;
    }

    return '';
  }

  private weChatAuth(params: IWeChatMessageParams): boolean {
    const { signature, timestamp, nonce } = params;
    const token = config.weChatToken;

    const paramsSort = [token, timestamp, nonce];
    paramsSort.sort();

    const paramsStr = paramsSort.join('');
    const shaParams = sha1(paramsStr);

    return shaParams === signature;
  }
}
