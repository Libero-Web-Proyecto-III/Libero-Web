import { IsString, IsOptional, IsArray, MinLength } from 'class-validator';

export class CreatePublicationDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  media?: string[];
}