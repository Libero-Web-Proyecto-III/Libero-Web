import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyEntity } from './entities/survey.entity';
import { SurveyQuestionEntity } from './entities/survey-question.entity';
import { SurveyOptionEntity } from './entities/survey-option.entity';
import { SurveyResponseEntity } from './entities/survey-response.entity';
import { SurveyAnswerEntity } from './entities/survey-answer.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SubmitSurveyResponseDto } from './dto/submit-response.dto';
import { UserEntity } from '../user/entities/user.entity';
import { SurveyStatusEnum } from './enums/survey.enum';
import { containsProfanity } from '../../common/utils/profanity-filter.util';

// # Este bloque tiene como objetivo proveer la lógica de negocio para crear, consultar, actualizar, responder y calcular resultados de encuestas
@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(SurveyEntity)
    private readonly surveyRepository: Repository<SurveyEntity>,
    @InjectRepository(SurveyQuestionEntity)
    private readonly questionRepository: Repository<SurveyQuestionEntity>,
    @InjectRepository(SurveyOptionEntity)
    private readonly optionRepository: Repository<SurveyOptionEntity>,
    @InjectRepository(SurveyResponseEntity)
    private readonly responseRepository: Repository<SurveyResponseEntity>,
    @InjectRepository(SurveyAnswerEntity)
    private readonly answerRepository: Repository<SurveyAnswerEntity>,
  ) {}

  // # Este bloque tiene como objetivo crear una nueva encuesta guardando sus preguntas y opciones en cascada asignando la entidad del usuario creador
  async create(dto: CreateSurveyDto, user?: any): Promise<SurveyEntity> {
    const userId = user?.index || user?.id;
    const userRelation = userId ? ({ index: userId } as UserEntity) : undefined;

    const survey = this.surveyRepository.create({
      title: dto.title,
      description: dto.description,
      isPublic: dto.isPublic ?? true,
      status: dto.status ?? SurveyStatusEnum.DRAFT,
      startDate: dto.startDate,
      endDate: dto.endDate,
      createdBy: userRelation,
      questions: dto.questions.map((q, qIndex) =>
        this.questionRepository.create({
          title: q.title,
          type: q.type,
          isRequired: q.isRequired ?? true,
          order: q.order ?? qIndex + 1,
          options: (q.options || []).map((o, oIndex) =>
            this.optionRepository.create({
              optionText: o.optionText,
              order: o.order ?? oIndex + 1,
            }),
          ),
        }),
      ),
    });

    return await this.surveyRepository.save(survey);
  }

  // # Este bloque tiene como objetivo obtener el listado de encuestas ordenadas descendentemente por fecha de creación y filtradas por estado o visibilidad
  async findAll(status?: SurveyStatusEnum, isPublic?: boolean): Promise<SurveyEntity[]> {
    const query = this.surveyRepository.createQueryBuilder('survey')
      .leftJoinAndSelect('survey.createdBy', 'createdBy')
      .leftJoinAndSelect('survey.questions', 'questions')
      .leftJoinAndSelect('questions.options', 'options')
      .where('survey.deletedAt IS NULL')
      .orderBy('survey.createdAt', 'DESC');

    if (status) {
      query.andWhere('survey.status = :status', { status });
    }

    if (isPublic !== undefined) {
      query.andWhere('survey.isPublic = :isPublic', { isPublic });
    }

    query.orderBy('survey.createdAt', 'DESC')
         .addOrderBy('questions.order', 'ASC')
         .addOrderBy('options.order', 'ASC');

    return await query.getMany();
  }

  // # Este bloque tiene como objetivo buscar y retornar una encuesta por su ID con todas sus preguntas y opciones ordenadas
  async findOne(id: number): Promise<SurveyEntity> {
    const survey = await this.surveyRepository.findOne({
      where: { index: id },
      relations: {
        createdBy: true,
        questions: {
          options: true,
        },
      },
      order: {
        questions: {
          order: 'ASC',
          options: {
            order: 'ASC',
          },
        },
      },
    });

    if (!survey) {
      throw new NotFoundException(`La encuesta con ID ${id} no fue encontrada.`);
    }

    return survey;
  }

  // # Este bloque tiene como objetivo actualizar la información, estado o estructura de preguntas de una encuesta
  async update(id: number, dto: UpdateSurveyDto): Promise<SurveyEntity> {
    const survey = await this.findOne(id);

    if (dto.title !== undefined) survey.title = dto.title;
    if (dto.description !== undefined) survey.description = dto.description;
    if (dto.isPublic !== undefined) survey.isPublic = dto.isPublic;
    if (dto.status !== undefined) {
      survey.status = dto.status;
      if (dto.status === SurveyStatusEnum.CLOSED && !dto.endDate) {
        survey.endDate = new Date();
      }
    }
    if (dto.startDate !== undefined) survey.startDate = dto.startDate;
    if (dto.endDate !== undefined) survey.endDate = dto.endDate;

    if (dto.questions) {
      await this.questionRepository.delete({ survey: { index: id } });
      survey.questions = dto.questions.map((q, qIndex) =>
        this.questionRepository.create({
          title: q.title,
          type: q.type,
          isRequired: q.isRequired ?? true,
          order: q.order ?? qIndex + 1,
          options: (q.options || []).map((o, oIndex) =>
            this.optionRepository.create({
              optionText: o.optionText,
              order: o.order ?? oIndex + 1,
            }),
          ),
        }),
      );
    }

    return await this.surveyRepository.save(survey);
  }

  // # Este bloque tiene como objetivo realizar el borrado lógico (softDelete) de una encuesta
  async remove(id: number): Promise<{ success: boolean; message: string }> {
    const survey = await this.findOne(id);
    await this.surveyRepository.softRemove(survey);
    return {
      success: true,
      message: `La encuesta con ID ${id} ha sido eliminada.`,
    };
  }

  // # Este bloque tiene como objetivo consultar si un usuario autenticado ya ha respondido previamente a una encuesta
  async getUserStatus(surveyId: number, user?: any): Promise<{ responded: boolean }> {
    const userId = user?.index || user?.id;
    if (!userId) return { responded: false };
    const existingResponse = await this.responseRepository.findOne({
      where: {
        survey: { index: surveyId },
        user: { index: userId },
      },
    });
    return { responded: !!existingResponse };
  }

  // # Este bloque tiene como objetivo guardar las respuestas enviadas por un usuario autenticado validando respuesta única por usuario, vigencia, obligatoriedad y filtro de groserías
  async submitResponse(
    surveyId: number,
    dto: SubmitSurveyResponseDto,
    user?: any,
    ipHash?: string,
  ): Promise<SurveyResponseEntity> {
    const userId = user?.index || user?.id;
    if (!userId) {
      throw new UnauthorizedException('Debes registrarte o iniciar sesión para participar en esta encuesta.');
    }

    const survey = await this.findOne(surveyId);

    if (survey.status !== SurveyStatusEnum.PUBLISHED) {
      throw new BadRequestException('Esta encuesta no se encuentra activa para recibir respuestas.');
    }

    // Validar que el usuario no haya respondido previamente a esta encuesta (1 sola respuesta por usuario)
    const existingResponse = await this.responseRepository.findOne({
      where: {
        survey: { index: surveyId },
        user: { index: userId },
      },
    });

    if (existingResponse) {
      throw new BadRequestException('Ya has respondido previamente a esta encuesta. Solo se permite 1 participación por usuario.');
    }

    // Validar filtro de seguridad contra lenguaje ofensivo / groserías
    for (const answerDto of dto.answers) {
      if (answerDto.textValue && containsProfanity(answerDto.textValue)) {
        throw new BadRequestException(
          'Tu respuesta contiene expresiones o palabras no permitidas por las políticas de respeto y convivencia de Libero Web.',
        );
      }
    }

    // Validar preguntas obligatorias
    const answeredQuestionIds = new Set(dto.answers.map((a) => a.questionId));
    for (const q of survey.questions) {
      if (q.isRequired && !answeredQuestionIds.has(q.index)) {
        throw new BadRequestException(`La pregunta "${q.title}" es de respuesta obligatoria.`);
      }
    }

    // Construir entrega de respuestas
    const userRelation = { index: userId } as UserEntity;
    const responseEntity = this.responseRepository.create({
      survey,
      user: userRelation,
      ipHash: ipHash || null,
      answers: [],
    });

    const savedResponse = await this.responseRepository.save(responseEntity);

    const answersToSave: SurveyAnswerEntity[] = [];
    for (const answerDto of dto.answers) {
      const question = survey.questions.find((q) => q.index === answerDto.questionId);
      if (!question) continue;

      if (answerDto.optionIds && answerDto.optionIds.length > 0) {
        // Múltiples opciones seleccionadas
        for (const optId of answerDto.optionIds) {
          const selectedOption = question.options?.find((o) => o.index === optId);
          answersToSave.push(
            this.answerRepository.create({
              response: savedResponse,
              question,
              selectedOption: selectedOption || null,
              textValue: answerDto.textValue || null,
            }),
          );
        }
      } else {
        // Opción única o texto libre
        const selectedOption = answerDto.optionId
          ? question.options?.find((o) => o.index === answerDto.optionId)
          : null;

        answersToSave.push(
          this.answerRepository.create({
            response: savedResponse,
            question,
            selectedOption: selectedOption || null,
            textValue: answerDto.textValue || null,
          }),
        );
      }
    }

    await this.answerRepository.save(answersToSave);
    return (await this.responseRepository.findOne({
      where: { index: savedResponse.index },
      relations: {
        answers: {
          question: true,
          selectedOption: true,
        },
      },
    })) as SurveyResponseEntity;
  }

  // # Este bloque tiene como objetivo procesar y calcular los resultados, porcentajes y listas de respuestas con perfil del participante para administradores
  async getSurveyResults(surveyId: number): Promise<any> {
    const survey = await this.findOne(surveyId);
    const responses = await this.responseRepository.find({
      where: { survey: { index: surveyId } },
      relations: {
        survey: true,
        user: {
          rol: true,
        },
        answers: {
          question: true,
          selectedOption: true,
        },
      },
      order: {
        submittedAt: 'DESC',
      },
    });

    const totalResponses = responses.length;

    const questionResults = survey.questions.map((question) => {
      const answersForQuestion = responses.flatMap((r) =>
        (r.answers || []).filter((a) => a.question?.index === question.index),
      );

      const optionCounts: Record<number, number> = {};
      question.options?.forEach((o) => {
        optionCounts[o.index] = 0;
      });

      const textAnswers: string[] = [];

      answersForQuestion.forEach((a) => {
        if (a.selectedOption) {
          optionCounts[a.selectedOption.index] = (optionCounts[a.selectedOption.index] || 0) + 1;
        }
        if (a.textValue && a.textValue.trim() !== '') {
          textAnswers.push(a.textValue);
        }
      });

      const optionsSummary = (question.options || []).map((o) => {
        const count = optionCounts[o.index] || 0;
        const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
        return {
          id: o.index,
          optionText: o.optionText,
          count,
          percentage,
        };
      });

      return {
        id: question.index,
        title: question.title,
        type: question.type,
        options: optionsSummary,
        textAnswers,
        totalAnswers: answersForQuestion.length,
      };
    });

    // # Este bloque formatea la lista de respuestas individuales detalladas con la información del perfil del usuario o participante
    const individualResponses = responses.map((resp) => {
      const respondentName = resp.user?.name || (resp.user as any)?.username || 'Encuestado Anónimo / Ciudadano';
      const respondentEmail = resp.user?.email || 'Participante sin registro';
      const respondentRole = resp.user?.rol?.name || (resp.user as any)?.role || 'Invitado';

      const answersDetail = (resp.answers || []).map((ans) => {
        let answerText = ans.textValue || '';
        if (ans.selectedOption) {
          answerText = ans.selectedOption.optionText;
        }
        return {
          questionId: ans.question?.index,
          questionTitle: ans.question?.title,
          questionType: ans.question?.type,
          answerText,
        };
      });

      return {
        id: resp.index,
        respondentName,
        respondentEmail,
        respondentRole,
        submittedAt: resp.submittedAt,
        answers: answersDetail,
      };
    });

    return {
      surveyId: survey.index,
      title: survey.title,
      status: survey.status,
      totalResponses,
      questions: questionResults,
      individualResponses,
    };
  }
}
