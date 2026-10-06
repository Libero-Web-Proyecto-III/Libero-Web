import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PRIVATE } from '../decorator/private.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPrivate = this.reflector.getAllAndOverride<boolean>(PRIVATE,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    if (isPrivate) {
      return super.canActivate(context);
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.['authorization'] || request.headers?.['Authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return super.canActivate(context);
    }

    return true;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPrivate = this.reflector.getAllAndOverride<boolean>(PRIVATE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPrivate) {
      if (err || !user) {
        throw err || new UnauthorizedException();
      }
      return user;
    }

    return user || null;
  }
}