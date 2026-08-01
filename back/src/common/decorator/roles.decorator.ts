import { Reflector } from "@nestjs/core";
import { enumRol } from "../enums/rol.enum";


export const ROLES = Reflector.createDecorator<enumRol[]>()