import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { RefreshTokensRepository } from "../users/users.repository";
import { RedisService } from "../redis/redis.service";
import { CryptoUtil } from "../utils/crypto.util";

describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let refreshTokensRepository: jest.Mocked<RefreshTokensRepository>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockUsersService = {
      createUser: jest.fn(),
      validateUser: jest.fn(),
      findById: jest.fn(),
    };

    const mockRefreshTokensRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      deleteByToken: jest.fn(),
      deleteByUserId: jest.fn(),
    };

    const mockRedisService = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: RefreshTokensRepository,
          useValue: mockRefreshTokensRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    refreshTokensRepository = module.get(RefreshTokensRepository);
    redisService = module.get(RedisService);
  });

  describe("signup", () => {
    const testCases = [
      {
        name: "should create user and generate tokens",
        signupDto: {
          email: "test@example.com",
          password: "password123",
          name: "Test User",
        },
        mockUser: {
          id: 1,
          email: "test@example.com",
          name: "Test User",
        },
        expectedResult: {
          user: {
            id: 1,
            email: "test@example.com",
            name: "Test User",
          },
        },
      },
      {
        name: "should create user without name",
        signupDto: {
          email: "test2@example.com",
          password: "password123",
        },
        mockUser: {
          id: 2,
          email: "test2@example.com",
        },
        expectedResult: {
          user: {
            id: 2,
            email: "test2@example.com",
          },
        },
      },
    ];

    testCases.forEach(({ name, signupDto, mockUser, expectedResult }) => {
      it(name, async () => {
        usersService.createUser.mockResolvedValue(mockUser as any);
        refreshTokensRepository.create.mockResolvedValue({
          id: 1,
          user_id: mockUser.id,
          token: "refresh-token",
          expires_at: new Date(),
          created_at: new Date(),
        });
        redisService.set.mockResolvedValue(undefined);

        const result = await service.signup(signupDto);

        expect(usersService.createUser).toHaveBeenCalledWith(
          signupDto.email,
          signupDto.password,
          signupDto.name
        );
        expect(result).toEqual(expectedResult);
        expect(refreshTokensRepository.create).toHaveBeenCalled();
        expect(redisService.set).toHaveBeenCalled();
      });
    });
  });

  describe("signin", () => {
    const testCases = [
      {
        name: "should sign in with valid credentials",
        signinDto: {
          email: "test@example.com",
          password: "password123",
        },
        mockUser: {
          id: 1,
          email: "test@example.com",
          name: "Test User",
        },
        expectedResult: {
          user: {
            id: 1,
            email: "test@example.com",
            name: "Test User",
          },
        },
      },
      {
        name: "should throw UnauthorizedException with invalid credentials",
        signinDto: {
          email: "test@example.com",
          password: "wrongpassword",
        },
        mockUser: null,
        shouldThrow: UnauthorizedException,
      },
    ];

    testCases.forEach(
      ({ name, signinDto, mockUser, expectedResult, shouldThrow }) => {
        it(name, async () => {
          usersService.validateUser.mockResolvedValue(mockUser as any);

          if (shouldThrow) {
            await expect(service.signin(signinDto)).rejects.toThrow(
              shouldThrow
            );
          } else {
            refreshTokensRepository.create.mockResolvedValue({
              id: 1,
              user_id: mockUser!.id,
              token: "refresh-token",
              expires_at: new Date(),
              created_at: new Date(),
            });
            redisService.set.mockResolvedValue(undefined);

            const result = await service.signin(signinDto);

            expect(usersService.validateUser).toHaveBeenCalledWith(
              signinDto.email,
              signinDto.password
            );
            expect(result).toEqual(expectedResult);
          }
        });
      }
    );
  });

  describe("refreshAccessToken", () => {
    const testCases = [
      {
        name: "should refresh access token with valid refresh token",
        refreshToken: "valid-refresh-token",
        mockTokenRecord: {
          id: 1,
          user_id: 1,
          token: "valid-refresh-token",
          expires_at: new Date(Date.now() + 86400000),
          created_at: new Date(),
        },
        mockUser: {
          id: 1,
          email: "test@example.com",
        },
        shouldThrow: null,
      },
      {
        name: "should throw UnauthorizedException with invalid refresh token",
        refreshToken: "invalid-refresh-token",
        mockTokenRecord: null,
        shouldThrow: UnauthorizedException,
      },
      {
        name: "should throw UnauthorizedException when user not found",
        refreshToken: "valid-refresh-token",
        mockTokenRecord: {
          id: 1,
          user_id: 999,
          token: "valid-refresh-token",
          expires_at: new Date(Date.now() + 86400000),
          created_at: new Date(),
        },
        mockUser: null,
        shouldThrow: UnauthorizedException,
      },
    ];

    testCases.forEach(
      ({ name, refreshToken, mockTokenRecord, mockUser, shouldThrow }) => {
        it(name, async () => {
          refreshTokensRepository.findByToken.mockResolvedValue(
            mockTokenRecord as any
          );
          usersService.findById.mockResolvedValue(mockUser as any);

          if (shouldThrow) {
            await expect(
              service.refreshAccessToken(refreshToken)
            ).rejects.toThrow(shouldThrow);
          } else {
            refreshTokensRepository.create.mockResolvedValue({
              id: 2,
              user_id: mockUser!.id,
              token: "new-refresh-token",
              expires_at: new Date(),
              created_at: new Date(),
            });
            redisService.set.mockResolvedValue(undefined);

            const result = await service.refreshAccessToken(refreshToken);

            expect(refreshTokensRepository.findByToken).toHaveBeenCalledWith(
              refreshToken
            );
            expect(result).toHaveProperty("accessToken");
            expect(result).toHaveProperty("refreshToken");
          }
        });
      }
    );
  });

  describe("validateToken", () => {
    const testCases = [
      {
        name: "should validate token from cache",
        token: "cached-token",
        cachedUser: JSON.stringify({ id: 1, email: "test@example.com" }),
        shouldUseCache: true,
      },
      {
        name: "should validate token from JWT when not cached",
        token: "jwt-token",
        cachedUser: null,
        jwtPayload: { userId: 1, email: "test@example.com" },
        mockUser: {
          id: 1,
          email: "test@example.com",
        },
        shouldUseCache: false,
      },
      {
        name: "should throw UnauthorizedException with invalid token",
        token: "invalid-token",
        cachedUser: null,
        shouldThrow: UnauthorizedException,
      },
    ];

    testCases.forEach(
      ({
        name,
        token,
        cachedUser,
        jwtPayload,
        mockUser,
        shouldUseCache,
        shouldThrow,
      }) => {
        it(name, async () => {
          redisService.get.mockResolvedValue(cachedUser);
          usersService.findById.mockResolvedValue(mockUser as any);
          redisService.set.mockResolvedValue(undefined);

          // Mock CryptoUtil.verifyToken for non-cached cases
          if (!shouldUseCache && !shouldThrow) {
            jest
              .spyOn(CryptoUtil, "verifyToken")
              .mockReturnValue(jwtPayload as any);
          } else if (shouldThrow) {
            jest.spyOn(CryptoUtil, "verifyToken").mockImplementation(() => {
              throw new Error("Invalid token");
            });
          }

          if (shouldThrow) {
            await expect(service.validateToken(token)).rejects.toThrow(
              shouldThrow
            );
          } else {
            const result = await service.validateToken(token);

            if (shouldUseCache) {
              expect(redisService.get).toHaveBeenCalledWith(
                `access_token:${token}`
              );
              expect(result).toEqual(JSON.parse(cachedUser!));
            } else {
              expect(CryptoUtil.verifyToken).toHaveBeenCalled();
              expect(usersService.findById).toHaveBeenCalledWith(
                jwtPayload!.userId
              );
              expect(result).toEqual(mockUser);
            }
          }
        });
      }
    );
  });

  describe("signout", () => {
    const testCases = [
      {
        name: "should delete refresh token and access token",
        refreshToken: "refresh-token",
        accessToken: "access-token",
      },
      {
        name: "should handle signout with only refresh token",
        refreshToken: "refresh-token",
        accessToken: undefined,
      },
      {
        name: "should handle signout with only access token",
        refreshToken: undefined,
        accessToken: "access-token",
      },
    ];

    testCases.forEach(({ name, refreshToken, accessToken }) => {
      it(name, async () => {
        refreshTokensRepository.deleteByToken.mockResolvedValue(undefined);
        redisService.del.mockResolvedValue(undefined);

        await service.signout(refreshToken!, accessToken);

        if (refreshToken) {
          expect(refreshTokensRepository.deleteByToken).toHaveBeenCalledWith(
            refreshToken
          );
        }
        if (accessToken) {
          expect(redisService.del).toHaveBeenCalledWith(
            `access_token:${accessToken}`
          );
        }
      });
    });
  });
});
