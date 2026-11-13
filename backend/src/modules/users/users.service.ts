import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hashPassword, verifyPassword } from '../../common/password.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { UpdateMeDto } from './dto/update-me.dto.js';
import { UserEntity } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private get users() {
    return this.prisma.db.orm.public.User;
  }

  /** Includes the password hash. Only for the auth module. */
  findByEmail(email: string) {
    return this.users.where({ email: email.trim().toLowerCase() }).first();
  }

  async findActiveById(id: string): Promise<UserEntity | null> {
    const row = await this.users.where({ id }).first();
    return row?.isActive ? UserEntity.from(row) : null;
  }

  async updateMe(id: string, dto: UpdateMeDto): Promise<UserEntity> {
    if (dto.fullName === undefined && dto.newPassword === undefined) {
      throw new BadRequestException('Nothing to update');
    }
    const changes: { fullName?: string; passwordHash?: string } = {};
    if (dto.fullName !== undefined) changes.fullName = dto.fullName;
    if (dto.newPassword !== undefined) {
      const current = await this.users.where({ id }).firstOrThrow();
      if (!(await verifyPassword(dto.currentPassword!, current.passwordHash))) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      changes.passwordHash = await hashPassword(dto.newPassword);
    }
    // A new password signs the user out everywhere: every active refresh token is revoked in the
    // same transaction, so a stolen session cannot outlive the password change.
    const updated = await this.prisma.db.transaction(async (tx) => {
      const row = await tx.orm.public.User.where({ id }).update(changes);
      if (row && changes.passwordHash) {
        await tx.orm.public.RefreshToken.where({ userId: id })
          .where((token) => token.revokedAt.isNull())
          .updateAll({ revokedAt: new Date() });
      }
      return row;
    });
    if (!updated) throw new NotFoundException('User not found');
    return UserEntity.from(updated);
  }
}
