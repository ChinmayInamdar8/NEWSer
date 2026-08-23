import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const from = request.query?.from === 'admin' ? 'admin' : 'web';

    return {
      scope: ['email', 'profile'],
      state: from,
      session: false,
    };
  }
}
