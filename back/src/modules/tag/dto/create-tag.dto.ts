import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto {
    @ApiProperty({
        example: 'frontend',
        description: 'Nombre único del tag',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @MinLength(1)
    name: string;

    @ApiPropertyOptional({
        example: '#7C3AED',
        description: 'Color hexadecimal del tag',
        default: '#ffffff',
    })
    @IsString()
    @IsOptional()
    @MaxLength(7)
    @MinLength(7)
    color: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Indica si el tag está activo',
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isActive: boolean;

    @ApiPropertyOptional({
        example: '2026-08-08T12:00:00.000Z',
        description: 'Fecha de creación del registro',
        type: String,
        format: 'date-time',
    })
    @IsOptional()
    @IsDate()
    createdAt: Date;

    @ApiPropertyOptional({
        example: '2026-08-08T12:00:00.000Z',
        description: 'Fecha de actualización del registro',
        type: String,
        format: 'date-time',
    })
    @IsDate()
    @IsOptional()
    updatedAt: Date;
}
