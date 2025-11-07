import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { CryptoUtil } from "../utils/crypto.util";
import { UserResponse } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(
    email: string,
    password: string,
    name?: string
  ): Promise<UserResponse> {
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    const hashedPassword = CryptoUtil.hashPassword(password);
    const user = await this.usersRepository.create(email, hashedPassword, name);

    return this.sanitizeUser(user);
  }

  async validateUser(
    email: string,
    password: string
  ): Promise<UserResponse | null> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = CryptoUtil.verifyPassword(password, user.password);
    if (!isValid) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  async findById(id: number): Promise<UserResponse> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: any): UserResponse {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
