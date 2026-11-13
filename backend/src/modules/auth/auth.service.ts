import { createHash, randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword, hashPassword } from '../../common/password.js';
import { env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UserEntity, type UserRow } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';

export interface SessionMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  refreshTokenId: string;
  user: UserEntity;
}

type Db = PrismaService['db'];
type Client = Pick<Db, 'orm'>;

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  /** Compared against when the email is unknown, so timing does not reveal which emails exist. */
  private readonly dummyHash = hashPassword(randomUUID());

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string, meta: SessionMeta): Promise<Session> {
    const user = await this.users.findByEmail(email);
    const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await this.dummyHash));
    if (!user || !user.isActive || !passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.openSession(this.prisma.db, user, randomUUID(), meta);
  }

  /**
   * Rotates the refresh token. A token that was already rotated is a replay:
   * the whole family is revoked (and that revocation is committed) before the 401.
   */
  async refresh(rawToken: string, meta: SessionMeta): Promise<Session> {
    const payload = await this.verifyRefreshToken(rawToken);
    const outcome = await this.prisma.db.transaction(async (tx) => {
      const tokens = tx.orm.public.RefreshToken;
      const stored = await tokens.where({ tokenHash: sha256(rawToken) }).forUpdate().first();
      if (!stored || stored.userId !== payload.sub) return null;
      if (stored.revokedAt) {
        await this.revokeFamily(tx, stored.familyId);
        return null;
      }
      if (stored.expiresAt <= new Date()) return null;

      const user = await tx.orm.public.User.where({ id: stored.userId }).first();
      if (!user?.isActive) {
        await this.revokeFamily(tx, stored.familyId);
        return null;
      }
      const session = await this.openSession(tx, user, stored.familyId, meta);
      await tokens.where({ id: stored.id }).update({
        revokedAt: new Date(),
        replacedById: session.refreshTokenId,
      });
      return session;
    });
    if (!outcome) throw new UnauthorizedException('Invalid refresh token');
    return outcome;
  }

  /** Revokes the presented refresh token. Never throws on a bad token: logout always succeeds. */
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.prisma.db.orm.public.RefreshToken
      .where((token) => token.tokenHash.eq(sha256(rawToken)))
      .where((token) => token.revokedAt.isNull())
      .updateAll({ revokedAt: new Date() });
  }

  private revokeFamily(client: Client, familyId: string) {
    return client.orm.public.RefreshToken
      .where({ familyId })
      .where((token) => token.revokedAt.isNull())
      .updateAll({ revokedAt: new Date() });
  }

  private async verifyRefreshToken(rawToken: string): Promise<{ sub: string }> {
    try {
      return await this.jwt.verifyAsync<{ sub: string }>(rawToken, {
        secret: env.jwtRefreshSecret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async openSession(client: Client, user: UserRow, familyId: string, meta: SessionMeta) {
    const tokenId = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti: tokenId, family: familyId },
      { secret: env.jwtRefreshSecret, algorithm: 'HS256', expiresIn: env.jwtRefreshTtl as never },
    );
    const { exp } = this.jwt.decode<{ exp: number }>(refreshToken);
    const refreshExpiresAt = new Date(exp * 1000);
    await client.orm.public.RefreshToken.create({
      id: tokenId,
      userId: user.id,
      familyId,
      tokenHash: sha256(refreshToken),
      expiresAt: refreshExpiresAt,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
    });
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { secret: env.jwtAccessSecret, algorithm: 'HS256', expiresIn: env.jwtAccessTtl as never },
    );
    return {
      accessToken,
      refreshToken,
      refreshExpiresAt,
      refreshTokenId: tokenId,
      user: UserEntity.from(user),
    };
  }
}
