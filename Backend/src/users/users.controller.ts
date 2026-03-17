import { Body, Controller, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/role.enum';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADVISOR, Role.ADMIN)
  async listUsers() {
    const users = await this.usersService.listAll();
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    const updated = await this.usersService.updateRole(id, dto.role);
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    };
  }
}
