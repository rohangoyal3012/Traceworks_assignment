import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient } from "pg";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  async onModuleInit() {
    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || "authdb",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    await this.initializeTables();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private async initializeTables() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
      `);
    } finally {
      client.release();
    }
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }
}
