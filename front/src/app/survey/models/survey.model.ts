// # Este bloque tiene como objetivo definir las interfaces TypeScript y contratos de datos para las encuestas, respuestas y resultados

export enum QuestionTypeEnum {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  OPEN_TEXT = 'OPEN_TEXT',
  RATING = 'RATING',
}

export enum SurveyStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

export interface SurveyOption {
  index: number;
  uuid?: string;
  optionText: string;
  order?: number;
}

export interface SurveyQuestion {
  index: number;
  uuid?: string;
  title: string;
  type: QuestionTypeEnum;
  isRequired: boolean;
  order?: number;
  options: SurveyOption[];
}

export interface Survey {
  index: number;
  uuid: string;
  title: string;
  description?: string;
  isPublic: boolean;
  status: SurveyStatusEnum;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    index: number;
    name: string;
    email: string;
  };
  questions: SurveyQuestion[];
}

export interface CreateSurveyOptionDto {
  optionText: string;
  order?: number;
}

export interface CreateSurveyQuestionDto {
  title: string;
  type: QuestionTypeEnum;
  isRequired?: boolean;
  order?: number;
  options?: CreateSurveyOptionDto[];
}

export interface CreateSurveyDto {
  title: string;
  description?: string;
  isPublic?: boolean;
  status?: SurveyStatusEnum;
  startDate?: string;
  endDate?: string;
  questions: CreateSurveyQuestionDto[];
}

export interface SubmitAnswerDto {
  questionId: number;
  optionId?: number;
  optionIds?: number[];
  textValue?: string;
}

export interface SubmitSurveyResponseDto {
  answers: SubmitAnswerDto[];
}

export interface OptionResult {
  id: number;
  optionText: string;
  count: number;
  percentage: number;
}

export interface QuestionResult {
  id: number;
  title: string;
  type: QuestionTypeEnum;
  options: OptionResult[];
  textAnswers: string[];
  totalAnswers: number;
}

export interface IndividualAnswerDetail {
  questionId: number;
  questionTitle: string;
  questionType: QuestionTypeEnum;
  answerText: string;
}

export interface IndividualRespondent {
  id: number;
  respondentName: string;
  respondentEmail: string;
  respondentRole: string;
  submittedAt: string;
  answers: IndividualAnswerDetail[];
}

export interface SurveyResults {
  surveyId: number;
  title: string;
  status: SurveyStatusEnum;
  totalResponses: number;
  questions: QuestionResult[];
  individualResponses?: IndividualRespondent[];
}
