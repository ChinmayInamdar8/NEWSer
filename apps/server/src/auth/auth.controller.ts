import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '@workspace/auth';
import type { SessionUser } from '@workspace/types';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user as SessionUser;
    const webOrigin =
      this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000';
    const adminOrigin =
      this.config.get<string>('ADMIN_ORIGIN') ?? 'http://localhost:3001';
    const state = Array.isArray(req.query.state)
      ? req.query.state[0]
      : req.query.state;
    const fromAdmin = state === 'admin';

    if (fromAdmin && user.role !== 'ADMIN') {
      return res.redirect(`${adminOrigin}/login?error=forbidden`);
    }

    const token = await this.authService.signAccessToken(user);

    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV') === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(fromAdmin ? adminOrigin : webOrigin);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: SessionUser) {
    return user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    return { ok: true };
  }
}
