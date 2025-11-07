import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignupDto, SigninDto } from "./dto/auth.dto";
import { AuthGuard } from "./guards/auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post("signin")
  @HttpCode(200)
  async signin(@Body() signinDto: SigninDto) {
    return this.authService.signin(signinDto);
  }

  @Post("signout")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async signout(@Request() req) {
    const token = req.headers.authorization.substring(7);
    await this.authService.signout(token);
    return { message: "Signed out successfully" };
  }

  @Post("validate")
  @UseGuards(AuthGuard)
  async validate(@Request() req) {
    return { user: req.user };
  }
}
