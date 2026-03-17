import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @IsOptional()
  commerce: string;

  @IsString()
  @IsOptional()
  concept?: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['ARS', 'USD', 'EUR', 'GBP', 'MXN'])
  currency: 'ARS' | 'USD' | 'EUR' | 'GBP' | 'MXN';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  participants?: number;
}
