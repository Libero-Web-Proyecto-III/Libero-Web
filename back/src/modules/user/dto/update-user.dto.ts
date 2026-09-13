import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'admin', description: 'Nombre del rol a asignar' })
  @IsString()
  @IsNotEmpty()
  role: string;
}

export class UpdateUserTagDto {
  @ApiProperty({ example: 1, description: 'ID del tag a asignar', required: false, nullable: true })
  @IsNumber()
  @IsOptional()
  tagId?: number | null;
}

export class UpdateUserTagsDto {
  @ApiProperty({ example: [1, 2], description: 'Lista de IDs de tags a asignar', type: [Number], required: false })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  tagIds?: number[];
}
