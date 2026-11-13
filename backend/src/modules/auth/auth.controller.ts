import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/current-user.decorator.js';
import { Public } from '../../common/public.decorator.js';
import { env } from '../../config/env.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { AuthThrottlerGuard } from './auth-throttler.guard.js';
import { AuthService, type Session } from './auth.service.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';

export const REFRESH_COOKIE = 'refresh_token';
const COOKIE_PATH = '/api/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in; sets the refresh cookie' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.login(dto.email, dto.password, this.meta(req));
    return this.respond(res, session);
  }

  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate the refresh cookie and get a new access token' })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.refresh(this.cookie(req) ?? '', this.meta(req));
    return this.respond(res, session);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke the refresh token and clear the cookie' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.cookie(req));
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Current user' })
  @ApiOkResponse({ type: UserEntity })
  me(@CurrentUser() user: UserEntity) {
    return user;
  }

  private respond(res: Response, session: Session): AuthResponseDto {
    res.cookie(REFRESH_COOKIE, session.refreshToken, {
      ...this.cookieOptions(),
      expires: session.refreshExpiresAt,
    });
    return { accessToken: session.accessToken, user: session.user };
  }

  private cookie(req: Request): string | undefined {
    return (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'strict' as const,
      path: COOKIE_PATH,
    };
  }

  private meta(req: Request) {
    return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  }
}
