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
