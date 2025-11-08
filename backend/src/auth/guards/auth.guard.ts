import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Try to get token from cookie first (preferred)
    let token = request.cookies?.access_token;

    // Fallback to Authorization header
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const user = await this.authService.validateToken(token);
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
