import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0.01)
  targetAmount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  savedAmount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  deadline?: string;
}
