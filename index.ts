import { initConfig } from "./config";

async function start() {
  await initConfig();
  const app = require('./app');
  return app.start();
}

start();