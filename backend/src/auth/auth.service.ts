import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { RefreshTokensRepository } from "../users/users.repository";
import { RedisService } from "../redis/redis.service";
import { CryptoUtil } from "../utils/crypto.util";
import { SignupDto, SigninDto, AuthResponseDto } from "./dto/auth.dto";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly JWT_SECRET =
    process.env.JWT_SECRET || "your-secret-key-change-in-production";
  private readonly ACCESS_TOKEN_EXPIRY = 900; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = 604800; // 7 days

  constructor(
    private readonly usersService: UsersService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly redisService: RedisService
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const user = await this.usersService.createUser(
      signupDto.email,
      signupDto.password,
      signupDto.name
    );

    await this.generateTokens(user.id, user.email);

    return {
      user,
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

    await this.generateTokens(user.id, user.email);

    return {
      user,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token from database
    const tokenRecord = await this.refreshTokensRepository.findByToken(
      refreshToken
    );

    if (!tokenRecord) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Get user
    const user = await this.usersService.findById(tokenRecord.user_id);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Generate new token pair
    return await this.generateTokens(user.id, user.email);
  }

  async validateToken(token: string): Promise<any> {
    try {
      // First check if token exists in Redis (fast check)
      const cachedUser = await this.redisService.get(`access_token:${token}`);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      // If not in cache, verify JWT
      const payload = CryptoUtil.verifyToken(token, this.JWT_SECRET);

      // Fetch user from database
      const user = await this.usersService.findById(payload.userId);

      // Cache for future requests
      await this.redisService.set(
        `access_token:${token}`,
        JSON.stringify(user),
        this.ACCESS_TOKEN_EXPIRY
      );

      return user;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  async signout(refreshToken: string, accessToken?: string): Promise<void> {
    // Delete refresh token from database
    if (refreshToken) {
      await this.refreshTokensRepository.deleteByToken(refreshToken);
    }

    // Delete access token from cache
    if (accessToken) {
      await this.redisService.del(`access_token:${accessToken}`);
    }
  }

  async generateTokens(userId: number, email: string): Promise<TokenPair> {
    // Generate access token (short-lived)
    const accessToken = CryptoUtil.generateToken(
      { userId, email, type: "access" },
      this.JWT_SECRET,
      this.ACCESS_TOKEN_EXPIRY
    );

    // Generate refresh token (long-lived)
    const refreshToken = CryptoUtil.generateRandomToken();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.REFRESH_TOKEN_EXPIRY);

    // Store refresh token in database
    await this.refreshTokensRepository.create(userId, refreshToken, expiresAt);

    // Cache access token in Redis
    await this.redisService.set(
      `access_token:${accessToken}`,
      JSON.stringify({ id: userId, email }),
      this.ACCESS_TOKEN_EXPIRY
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
