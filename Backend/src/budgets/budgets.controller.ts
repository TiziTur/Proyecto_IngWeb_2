import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly svc: BudgetsService) {}

  /** GET /budgets — list my budgets */
  @Get()
  findAll(@Req() req: { user: { id: string } }) {
    return this.svc.findAll(req.user.id);
  }

  /** PUT /budgets/:category — create or update a budget limit */
  @Put(':category')
  upsert(
    @Req() req: { user: { id: string } },
    @Param('category') category: string,
    @Body() dto: UpsertBudgetDto,
  ) {
    dto.category = decodeURIComponent(category);
    return this.svc.upsert(req.user.id, dto);
  }

  /** DELETE /budgets/:category — remove a budget limit */
  @Delete(':category')
  remove(
    @Req() req: { user: { id: string } },
    @Param('category') category: string,
  ) {
    return this.svc.remove(req.user.id, decodeURIComponent(category));
  }
}
