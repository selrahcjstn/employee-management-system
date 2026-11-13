import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { TokenCleanupService } from './token-cleanup.service.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
    // Login and refresh: 5 attempts per minute per IP + email (AUTH_RATE_LIMIT overrides, e.g. in tests).
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        { ttl: 60_000, limit: Number(process.env['AUTH_RATE_LIMIT'] ?? 5) },
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenCleanupService],
})
export class AuthModule {}
