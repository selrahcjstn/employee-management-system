import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
    const updated = await this.users.where({ id }).update(changes);
    if (!updated) throw new NotFoundException('User not found');
    return UserEntity.from(updated);
  }
}
