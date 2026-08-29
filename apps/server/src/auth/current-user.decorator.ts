import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SessionUser } from '@workspace/types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUser => {
    const request = context.switchToHttp().getRequest();
    return request.user as SessionUser;
  },
);
