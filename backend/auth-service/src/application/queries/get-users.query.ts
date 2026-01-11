export class GetUsersQuery {
  constructor(
    public readonly organizationId: string,
    public readonly options?: {
      page?: number;
      limit?: number;
      search?: string;
    },
  ) {}
}
