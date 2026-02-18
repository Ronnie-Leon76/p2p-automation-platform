export type BackendDatabaseClient = {
  from: (table: string) => any;
  auth?: {
    getUser?: () => Promise<any>;
    getSession?: () => Promise<any>;
  };
};
