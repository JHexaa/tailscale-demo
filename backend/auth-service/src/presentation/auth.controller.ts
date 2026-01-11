import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LoginDto, RefreshTokenDto, AuthResponseDto } from '../application/dto/auth.dto';
import { LoginCommand } from '../application/commands/login/login.command';
import { LogoutCommand } from '../application/commands/logout/logout.command';
import { RefreshTokenCommand } from '../application/commands/refresh-token/refresh-token.command';
import { GetMeQuery } from '../application/queries/get-me.query';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { JwtPayload } from '../infrastructure/services/jwt-token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.commandBus.execute(
      new LoginCommand(dto.email, dto.password, dto.organizationSlug),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() dto: RefreshTokenDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean }> {
    return this.commandBus.execute(
      new LogoutCommand(dto.refreshToken, user.sub),
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.commandBus.execute(new RefreshTokenCommand(dto.refreshToken));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new GetMeQuery(user.sub));
  }
}
