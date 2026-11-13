import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '../../config/env.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly users: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: env.jwtAccessSecret,
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.users.findActiveById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
