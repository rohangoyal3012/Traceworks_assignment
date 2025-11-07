import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./redis/redis.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [DatabaseModule, RedisModule, UsersModule, AuthModule],
})
export class AppModule {}
