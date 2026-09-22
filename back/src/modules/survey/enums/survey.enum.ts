// # Este bloque tiene como objetivo definir los estados posibles de una encuesta (Borrador, Publicada, Cerrada)
export enum SurveyStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

// # Este bloque tiene como objetivo definir los tipos de preguntas soportadas por el formulario dinámico
export enum QuestionTypeEnum {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  OPEN_TEXT = 'OPEN_TEXT',
  RATING = 'RATING',
}
