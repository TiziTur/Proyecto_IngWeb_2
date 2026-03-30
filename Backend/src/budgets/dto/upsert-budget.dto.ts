import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertBudgetDto {
  @IsNumber()
  @Min(0)
  limitAmount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  category: string;
}
