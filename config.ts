import axios from 'axios';

const config = {
  serverPort: 9000,
  mongodb: {
    dbName: '127.0.0.1',
    db: 'uranus',
    port: '27017',
    user: '',
    pass: '',
    authSource: '',
  },
  passsalt: '', // 用户密码存储加盐
  qcloudBucket: '', // 腾讯云bucket
  qcloudSecretId: '', // 腾讯云SecretId
  qcloudSecretKey: '', // 腾讯云SecretKey
  accessKeyId: 'xxx', // 阿里云
  accessKeySecret: 'xxx', // 阿里云
  STSAccessKeyId: 'xxx', // 阿里云 sts临时授权
  STSAccessKeySecret: 'xxx', // 阿里云 sts临时授权
  STSRoleArn: 'xxx', // 阿里云 sts临时授权
  STSPolicy: {}, // 阿里云 sts临时授权
  tencentkey: '', // 腾讯位置secreKey
  dxAppID: '', // 顶象登录验证
  dxAppSecret: '', // 顶象登录验证
  trPayappkey: '', // 图灵支付
  trPayappSceret: '', // 图灵支付
  notifyUrl: '', // 支付异步通知地址
  synNotifyUrl: '', // 客户端同步跳转
  githubClientID: '',
  githubClientSecret: '',
};

export const initConfig = async () => {
  const configEnv = process.env.CONFIG_ENV;

  if (configEnv === 'dev') {
    const result = await axios.get(`http://127.0.0.1:9001/api/config/dev`);
    Object.assign(config, result.data);
  } else if (configEnv === 'prod') {
    const result = await axios.get(`http://uranus-config:9001/api/config/prod`);
    Object.assign(config, result.data);
  }
};

export default config;