import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { User } from "./user.entity";

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(
    email: string,
    hashedPassword: string,
    name?: string
  ): Promise<User> {
    const result = await this.db.query(
      "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *",
      [email, hashedPassword, name]
    );
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.db.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    return result.rows[0] || null;
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.db.query(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashedPassword, id]
    );
  }
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
}

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(
    userId: number,
    token: string,
    expiresAt: Date
  ): Promise<RefreshToken> {
    const result = await this.db.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *",
      [userId, token, expiresAt]
    );
    return result.rows[0];
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const result = await this.db.query(
      "SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()",
      [token]
    );
    return result.rows[0] || null;
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
  }

  async deleteByUserId(userId: number): Promise<void> {
    await this.db.query("DELETE FROM refresh_tokens WHERE user_id = $1", [
      userId,
    ]);
  }

  async deleteExpired(): Promise<void> {
    await this.db.query(
      "DELETE FROM refresh_tokens WHERE expires_at < NOW()",
      []
    );
  }
}
