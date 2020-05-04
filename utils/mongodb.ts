import mongoose, { ConnectionOptions, Mongoose } from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
import config from '../config';

const RETRY_TIMEOUT = 3000;
const reconnectTries = 200;
let reconnectNum = 0;

export function connect(): Promise<Mongoose> {
  
  mongoose.set('bufferCommands', false);

  const options: ConnectionOptions = {
    useNewUrlParser: true,
    bufferMaxEntries: 0,
    autoReconnect: true,
    reconnectInterval: RETRY_TIMEOUT,
    reconnectTries,
  };
  
  if (config.mongodb.user) {
    options.user = config.mongodb.user;
    options.pass = config.mongodb.pass;
    options.authSource = config.mongodb.authSource;
    options.poolSize = 15;
  }
  
  const connection = mongoose.connect(`mongodb://${config.mongodb.dbName}:${config.mongodb.port}/${config.mongodb.db}`, options);

  connection.then((db) => {
    autoIncrement.initialize(db.connection);
  }).catch((err) => {
    console.error(`数据库连接错误: `, err);
  });

  mongoose.connection.on('error', () => {
    console.error(`数据库连接异常.`);
  });

  mongoose.connection.on('disconnected', () => {
    console.error(`数据库断开连接.`);
  });

  mongoose.connection.on('connected', () => {
    console.info('数据库连接成功.');
  });

  mongoose.connection.on('reconnected', () => {
    reconnectNum++;
    console.info(`数据库第${reconnectNum}次重新连接.`);
  });

  return connection;
}
