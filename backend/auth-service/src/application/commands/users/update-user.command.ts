export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
      roleIds?: string[];
    },
  ) {}
}
