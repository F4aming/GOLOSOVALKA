declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    APP_BASE_PATH?: string;
    API_BASE_URL?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
