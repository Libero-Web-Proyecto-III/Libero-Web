import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyEntity } from './entities/survey.entity';
import { SurveyQuestionEntity } from './entities/survey-question.entity';
import { SurveyOptionEntity } from './entities/survey-option.entity';
import { SurveyResponseEntity } from './entities/survey-response.entity';
import { SurveyAnswerEntity } from './entities/survey-answer.entity';
import { SurveyService } from './survey.service';
import { SurveyController } from './survey.controller';

// # Este bloque tiene como objetivo registrar el módulo de encuestas dinámicas, sus 5 entidades TypeORM, servicios y controlador
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SurveyEntity,
      SurveyQuestionEntity,
      SurveyOptionEntity,
      SurveyResponseEntity,
      SurveyAnswerEntity,
    ]),
  ],
  controllers: [SurveyController],
  providers: [SurveyService],
  exports: [SurveyService],
})
export class SurveyModule {}
