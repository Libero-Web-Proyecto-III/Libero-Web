import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico o nombre de usuario',
    example: 'usuario',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Usuario123',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}