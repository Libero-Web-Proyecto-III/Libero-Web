import {IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateTagDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @MinLength(1)
    name: string;
    
    @IsString()
    @IsOptional()
    @MaxLength(7)
    @MinLength(7)
    color: string;

    @IsBoolean()
    @IsOptional()
    isActive: boolean;
    
    @IsOptional()
    @IsDate()
    createdAt: Date;

    @IsDate()
    @IsOptional()
    updatedAt: Date;
}
