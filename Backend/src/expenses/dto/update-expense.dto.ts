import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateExpenseDto {
	@IsOptional()
	@IsString()
	commerce?: string;

	@IsOptional()
	@IsString()
	concept?: string;

	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsNumber()
	@Min(0.01)
	amount?: number;

	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsEnum(['ARS', 'USD', 'EUR', 'GBP', 'MXN'])
	currency?: 'ARS' | 'USD' | 'EUR' | 'GBP' | 'MXN';

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(50)
	participants?: number;
}
