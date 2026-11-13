import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserEntity } from '../modules/users/entities/user.entity.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserEntity =>
    context.switchToHttp().getRequest<Request & { user: UserEntity }>().user,
);
