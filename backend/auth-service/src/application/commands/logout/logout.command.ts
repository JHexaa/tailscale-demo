export class LogoutCommand {
  constructor(
    public readonly refreshToken: string,
    public readonly userId: string,
  ) {}
}
