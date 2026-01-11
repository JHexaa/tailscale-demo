import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPermissionsQuery } from './get-permissions.query';
import { PermissionRepository } from '../../infrastructure/repositories/permission.repository';

interface PermissionResponse {
  id: string;
  key: string;
  service: string;
  module: string;
  action: string;
  description: string | null;
}

@QueryHandler(GetPermissionsQuery)
export class GetPermissionsQueryHandler
  implements IQueryHandler<GetPermissionsQuery>
{
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async execute(query: GetPermissionsQuery): Promise<PermissionResponse[]> {
    const { service } = query;

    const permissions = service
      ? await this.permissionRepository.findByService(service)
      : await this.permissionRepository.findAll();

    return permissions.map((p) => ({
      id: p.id,
      key: `${p.service}:${p.module}:${p.action}`,
      service: p.service,
      module: p.module,
      action: p.action,
      description: p.description,
    }));
  }
}
