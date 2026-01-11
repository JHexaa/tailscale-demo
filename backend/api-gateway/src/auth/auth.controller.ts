import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  All,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUser } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly authServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.authServiceUrl = this.configService.get<string>(
      'AUTH_SERVICE_URL',
      'http://auth-service:3001',
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any, @Res() res: Response) {
    return this.proxyToAuthService('/auth/login', 'POST', body, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    return this.proxyToAuthService('/auth/logout', 'POST', body, res, req);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: any, @Res() res: Response) {
    return this.proxyToAuthService('/auth/refresh', 'POST', body, res);
  }

  @Get('me')
  async getMe(@Req() req: Request, @Res() res: Response) {
    return this.proxyToAuthService('/auth/me', 'GET', undefined, res, req);
  }

  private async proxyToAuthService(
    path: string,
    method: string,
    body: any,
    res: Response,
    req?: Request,
  ) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (req?.headers.authorization) {
        headers['Authorization'] = req.headers.authorization as string;
      }

      const response = await fetch(`${this.authServiceUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to connect to auth service',
      });
    }
  }
}
