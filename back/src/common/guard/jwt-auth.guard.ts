import { ExecutionContext, Injectable } from '@nestjs/common';
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

    if (isPrivate) return super.canActivate(context);
      else return true
  }
}