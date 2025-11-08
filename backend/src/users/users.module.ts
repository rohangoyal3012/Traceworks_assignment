import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersRepository, RefreshTokensRepository } from "./users.repository";

@Module({
  providers: [UsersService, UsersRepository, RefreshTokensRepository],
  exports: [UsersService, RefreshTokensRepository],
})
export class UsersModule {}
