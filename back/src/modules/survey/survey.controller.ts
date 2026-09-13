import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SurveyService } from './survey.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SubmitSurveyResponseDto } from './dto/submit-response.dto';
import { SurveyEntity } from './entities/survey.entity';
import { SurveyStatusEnum } from './enums/survey.enum';
import { PRIVATE } from '../../common/decorator/private.decorator';
import { ROLES } from '../../common/decorator/roles.decorator';
import { enumRol } from '../../common/enums/rol.enum';

// # Este bloque tiene como objetivo exponer los endpoints HTTP para la administración, consulta y respuestas de encuestas dinámicas (RF-17 y RF-18)
@ApiTags('Surveys')
@Controller('surveys')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  // # Este bloque tiene como objetivo expone el endpoint POST para que administradores o moderadores creen encuestas
  @Post()
  @PRIVATE()
  @ROLES([enumRol.ADMIN, enumRol.MOD])
  @ApiOperation({
    summary: 'Crear encuesta dinámica',
    description: 'Permite a administradores o moderadores construir un nuevo formulario dinámico de encuesta.',
  })
  @ApiResponse({ status: 201, description: 'Encuesta creada exitosamente', type: SurveyEntity })
  create(@Body() dto: CreateSurveyDto, @Req() req: any) {
    return this.surveyService.create(dto, req.user);
  }

  // # Este bloque tiene como objetivo expone el endpoint GET para listar encuestas filtrables por estado o visibilidad
  @Get()
  @ApiOperation({
    summary: 'Listar encuestas',
    description: 'Devuelve un listado de encuestas filtrable por estado y accesibilidad.',
  })
  @ApiQuery({ name: 'status', enum: SurveyStatusEnum, required: false })
  @ApiQuery({ name: 'isPublic', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'Lista de encuestas encontradas', type: [SurveyEntity] })
  findAll(
    @Query('status') status?: SurveyStatusEnum,
    @Query('isPublic') isPublic?: string,
  ) {
    const isPublicBool = isPublic !== undefined ? isPublic === 'true' : undefined;
    return this.surveyService.findAll(status, isPublicBool);
  }

  // # Este bloque tiene como objetivo expone el endpoint GET /:id para obtener el detalle de una encuesta específica
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de encuesta',
    description: 'Devuelve una encuesta con todas sus preguntas y opciones ordenadas.',
  })
  @ApiParam({ name: 'id', description: 'ID numérico de la encuesta', example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle de la encuesta', type: SurveyEntity })
  @ApiResponse({ status: 404, description: 'Encuesta no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.surveyService.findOne(id);
  }

  // # Este bloque tiene como objetivo exponer el endpoint POST /:id/responses exigiendo inicio de sesión obligatorio (@PRIVATE) para responder la encuesta (RF-18)
  @Post(':id/responses')
  @PRIVATE()
  @ApiOperation({
    summary: 'Enviar respuestas a encuesta',
    description: 'Guarda las respuestas a las preguntas de una encuesta activa exigiendo registro obligatorio.',
  })
  @ApiParam({ name: 'id', description: 'ID numérico de la encuesta', example: 1 })
  @ApiResponse({ status: 201, description: 'Respuesta registrada correctamente' })
  submitResponse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitSurveyResponseDto,
    @Req() req: any,
  ) {
    const clientIp = req.ip || req.connection?.remoteAddress;
    return this.surveyService.submitResponse(id, dto, req.user, clientIp);
  }

  // # Este bloque tiene como objetivo consultar si el usuario autenticado ya ha participado previamente en la encuesta especificada
  @Get(':id/user-status')
  @PRIVATE()
  @ApiOperation({
    summary: 'Consultar estado de respuesta del usuario',
    description: 'Retorna si el usuario autenticado ya ha enviado sus respuestas a la encuesta.',
  })
  @ApiParam({ name: 'id', description: 'ID numérico de la encuesta', example: 1 })
  getUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.surveyService.getUserStatus(id, req.user);
  }

  // # Este bloque tiene como objetivo expone el endpoint GET /:id/results para consultar resultados y estadísticas agregadas (ADMIN / MOD)
  @Get(':id/results')
  @PRIVATE()
  @ROLES([enumRol.ADMIN, enumRol.MOD])
  @ApiOperation({
    summary: 'Obtener resultados y estadísticas de la encuesta',
    description: 'Calcula totales, porcentajes de opción y respuestas abiertas para administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID numérico de la encuesta', example: 1 })
  @ApiResponse({ status: 200, description: 'Estadísticas agregadas de la encuesta' })
  getResults(@Param('id', ParseIntPipe) id: number) {
    return this.surveyService.getSurveyResults(id);
  }

  // # Este bloque tiene como objetivo expone el endpoint PATCH /:id para actualizar metadatos o preguntas de una encuesta
  @Patch(':id')
  @PRIVATE()
  @ROLES([enumRol.ADMIN, enumRol.MOD])
  @ApiOperation({
    summary: 'Actualizar encuesta',
    description: 'Permite modificar el estado, preguntas u opciones de una encuesta existente.',
  })
  @ApiParam({ name: 'id', description: 'ID numérico de la encuesta', example: 1 })
  @ApiResponse({ status: 200, description: 'Encuesta actualizada', type: SurveyEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSurveyDto,
  ) {
    return this.surveyService.update(id, dto);
  }

  // # Este bloque tiene como objetivo expone el endpoint DELETE /:id para eliminar lógicamente una encuesta
  @Delete(':id')
  @PRIVATE()
  @ROLES([enumRol.ADMIN, enumRol.MOD])
  @ApiOperation({
    summary: 'Eliminar encuesta',
    description: 'Elimina lógicamente una encuesta (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'ID numérico de la encuesta', example: 1 })
  @ApiResponse({ status: 200, description: 'Encuesta eliminada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.surveyService.remove(id);
  }
}
