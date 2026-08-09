import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { enumProperty } from "src/common/enums/property.enum";

export class CreateUserDto {

    @ApiProperty({
        example: enumProperty.name
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;

    @ApiProperty({
        example: enumProperty.email
    })
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string;

    @ApiProperty({
        example: enumProperty.password
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @ApiProperty({
        example: enumProperty.avatar
    })
    @IsString()
    @IsOptional()
    avatar: string;

    @ApiProperty({
        example: enumProperty.rol
    })
    @IsString()
    @IsOptional()
    rol?: string;

    @ApiProperty({
        example: enumProperty.tag,
        type: Number
    })
    @IsNumber()
    @IsOptional()
    tag?: number;

}
