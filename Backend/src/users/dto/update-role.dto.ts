import { IsEnum } from 'class-validator';
import { Role } from '../../common/roles/role.enum';

export class UpdateRoleDto {
  @IsEnum(Role)
  role: Role;
}
