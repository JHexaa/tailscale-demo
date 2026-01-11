import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}

export class RoleResponseDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  permissions: Array<{
    id: string;
    key: string;
    description: string | null;
  }>;
  usersCount: number;
}

export class RolesListResponseDto {
  roles: RoleResponseDto[];
  total: number;
  page: number;
  limit: number;
}
