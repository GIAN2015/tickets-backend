// src/data-source.ts
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const usingUrl = !!process.env.DATABASE_URL;

const common = {
  entities: ['src/**/*.entity.ts', 'src/**/entities/**/*.ts', 'dist/**/*.entity.js'],
  migrations: ['src/migrations/*.ts', 'dist/migrations/*.js'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: true,
  logging: false,
};

const opts: DataSourceOptions = usingUrl
  ? { type: 'postgres', url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, ...common }
  : { type: 'postgres', host: 'localhost', port: 5432, username: 'postgres', password: 'postgres', database: 'tickets_local', ssl: false, ...common };

export default new DataSource(opts);
