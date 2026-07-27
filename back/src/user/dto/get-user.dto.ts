import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { GetAllQueryDto } from "src/common/dto/get-all.dto";


export class GetAllUserQueryDto extends GetAllQueryDto {

    @ApiProperty({
        description: 'Relaciones extensibles a usuario',
        example: 'N/A' //UserRelations.join(',')
    })
    @IsOptional()
    @IsString()
    include?: string;
}