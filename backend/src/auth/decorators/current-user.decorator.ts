import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../strategies/jwt.strategy';

// Ambil user dari request, mis. @CurrentUser() user: AuthUser
// atau field tertentu: @CurrentUser('id') userId: string
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return data ? req.user?.[data] : req.user;
  },
);
