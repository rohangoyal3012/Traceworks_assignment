import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Response,
  HttpCode,
  HttpStatus,
  CookieOptions,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignupDto, SigninDto } from "./dto/auth.dto";
import { AuthGuard } from "./guards/auth.guard";

@Controller("auth")
export class AuthController {
  private readonly cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  };

  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() signupDto: SignupDto, @Response() res) {
    const result = await this.authService.signup(signupDto);
    const tokens = await this.authService.generateTokens(
      result.user.id,
      result.user.email
    );

    // Set cookies
    res.cookie("access_token", tokens.accessToken, {
      ...this.cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refresh_token", tokens.refreshToken, {
      ...this.cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(HttpStatus.CREATED).json(result);
  }

  @Post("signin")
  @HttpCode(200)
  async signin(@Body() signinDto: SigninDto, @Response() res) {
    const result = await this.authService.signin(signinDto);
    const tokens = await this.authService.generateTokens(
      result.user.id,
      result.user.email
    );

    // Set cookies
    res.cookie("access_token", tokens.accessToken, {
      ...this.cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refresh_token", tokens.refreshToken, {
      ...this.cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json(result);
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Request() req, @Response() res) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: "Refresh token not provided",
      });
    }

    try {
      const tokens = await this.authService.refreshAccessToken(refreshToken);

      // Set new cookies
      res.cookie("access_token", tokens.accessToken, {
        ...this.cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      res.cookie("refresh_token", tokens.refreshToken, {
        ...this.cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({ message: "Token refreshed successfully" });
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: "Invalid refresh token",
      });
    }
  }

  @Post("signout")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async signout(@Request() req, @Response() res) {
    const refreshToken = req.cookies?.refresh_token;
    const accessToken = req.cookies?.access_token;

    await this.authService.signout(refreshToken, accessToken);

    // Clear cookies
    res.clearCookie("access_token", this.cookieOptions);
    res.clearCookie("refresh_token", this.cookieOptions);

    return res.json({ message: "Signed out successfully" });
  }

  @Post("validate")
  @UseGuards(AuthGuard)
  async validate(@Request() req) {
    return { user: req.user };
  }
}
