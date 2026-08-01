import { Reflector } from "@nestjs/core";

export const PRIVATE = Reflector.createDecorator<boolean>()