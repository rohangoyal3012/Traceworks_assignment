import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { RedisService } from "../redis/redis.service";
import { CryptoUtil } from "../utils/crypto.util";
import { SignupDto, SigninDto, AuthResponseDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  private readonly JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key-change-in-production";
  private readonly TOKEN_EXPIRY = 3600; // 1 hour

  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const user = await this.usersService.createUser(
      signupDto.email,
      signupDto.password,
      signupDto.name
    );

    const token = await this.generateTokenAndCache(user.id, user.email);

    return {
      user,
      token,
    };
  }

  async signin(signinDto: SigninDto): Promise<AuthResponseDto> {
    const user = await this.usersService.validateUser(
      signinDto.email,
      signinDto.password
    );

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = await this.generateTokenAndCache(user.id, user.email);

    return {
      user,
      token,
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      // First check if token exists in Redis (fast check)
      const cachedUser = await this.redisService.get(`token:${token}`);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      // If not in cache, verify JWT
      const payload = CryptoUtil.verifyToken(token, this.JWT_SECRET);

      // Fetch user from database
      const user = await this.usersService.findById(payload.userId);

      // Cache for future requests
      await this.redisService.set(
        `token:${token}`,
        JSON.stringify(user),
        this.TOKEN_EXPIRY
      );

      return user;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  async signout(token: string): Promise<void> {
    await this.redisService.del(`token:${token}`);
  }

  private async generateTokenAndCache(
    userId: number,
    email: string
  ): Promise<string> {
    const token = CryptoUtil.generateToken(
      { userId, email },
      this.JWT_SECRET,
      this.TOKEN_EXPIRY
    );

    // Cache user data with token for fast lookup
    await this.redisService.set(
      `token:${token}`,
      JSON.stringify({ id: userId, email }),
      this.TOKEN_EXPIRY
    );

    return token;
  }
}
