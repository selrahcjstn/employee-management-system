import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator.js';
import { UpdateMeDto } from './dto/update-me.dto.js';
import { UserEntity } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the signed-in user' })
  @ApiOkResponse({ type: UserEntity })
  me(@CurrentUser() user: UserEntity) {
    return user;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own name or password' })
  @ApiOkResponse({ type: UserEntity })
  updateMe(@CurrentUser() user: UserEntity, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.id, dto);
  }
}
