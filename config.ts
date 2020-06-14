import axios from 'axios';

const config = {
  serverPort: null,
  mongodb: {
    dbName: '',
    db: '',
    port: '',
    user: '',
    pass: '',
    authSource: '',
  },
  passsalt: '', // 用户密码存储加盐
  qcloudBucket: '', // 腾讯云bucket
  qcloudSecretId: '', // 腾讯云SecretId
  qcloudSecretKey: '', // 腾讯云SecretKey
  accessKeyId: '', // 阿里云
  accessKeySecret: '', // 阿里云
  STSAccessKeyId: '', // 阿里云 sts临时授权
  STSAccessKeySecret: '', // 阿里云 sts临时授权
  STSRoleArn: '', // 阿里云 sts临时授权
  STSPolicy: {}, // 阿里云 sts临时授权
  tencentkey: '', // 腾讯位置secreKey
  dxAppID: '', // 顶象登录验证
  dxAppSecret: '', // 顶象登录验证
  trPayappkey: '', // 图灵支付
  trPayappSceret: '', // 图灵支付
  notifyUrl: '', // 支付异步通知地址
  synNotifyUrl: '', // 客户端同步跳转
};

export const initConfig = async () => {
  const result = await axios.get(`${process.env.config_url}/api/config`);
  Object.assign(config, result.data);
};

export default config;