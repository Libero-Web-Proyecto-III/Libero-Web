import {
  IsString,
  IsDateString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDateRangeValid', async: false })
export class IsDateRangeValid implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const { startDate } = args.object as CreateEventDto;
    if (!startDate || !endDate) return false;
    const now = new Date();
    return new Date(startDate) > now && new Date(endDate) > new Date(startDate);
  }
  defaultMessage() {
    return 'startDate debe ser posterior a hoy y anterior a endDate';
  }
}

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @Validate(IsDateRangeValid)
  endDate: string;
}