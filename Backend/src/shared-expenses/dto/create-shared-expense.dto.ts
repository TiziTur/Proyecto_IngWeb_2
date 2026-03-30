import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ParticipantShareDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(0)
  shareAmount: number;
}

export class CreateSharedExpenseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  /** UUID of the user who paid. Defaults to the creator if omitted. */
  @IsUUID()
  @IsOptional()
  paidByUserId?: string;

  /** Each participant and their share. Must include the creator if they participate. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantShareDto)
  participants: ParticipantShareDto[];
}
