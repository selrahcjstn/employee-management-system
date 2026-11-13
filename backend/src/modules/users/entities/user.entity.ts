import { ApiProperty } from '@nestjs/swagger';

export interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() email: string;
  @ApiProperty() fullName: string;
  @ApiProperty() role: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static from(row: UserRow): UserEntity {
    const entity = new UserEntity();
    entity.id = row.id;
    entity.email = row.email;
    entity.fullName = row.fullName;
    entity.role = row.role;
    entity.isActive = row.isActive;
    entity.createdAt = row.createdAt;
    entity.updatedAt = row.updatedAt;
    return entity;
  }
}
