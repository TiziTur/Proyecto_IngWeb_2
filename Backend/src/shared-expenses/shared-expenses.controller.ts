import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SharedExpensesService } from './shared-expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSharedExpenseDto } from './dto/create-shared-expense.dto';

@Controller('shared-expenses')
@UseGuards(JwtAuthGuard)
export class SharedExpensesController {
  constructor(private readonly svc: SharedExpensesService) {}

  /** POST /shared-expenses */
  @Post()
  create(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateSharedExpenseDto,
  ) {
    return this.svc.create(req.user.id, dto);
  }

  /** GET /shared-expenses */
  @Get()
  findAll(@Req() req: { user: { id: string } }) {
    return this.svc.findAll(req.user.id);
  }

  /** GET /shared-expenses/balance */
  @Get('balance')
  getBalance(@Req() req: { user: { id: string } }) {
    return this.svc.getBalance(req.user.id);
  }

  /** GET /shared-expenses/:id */
  @Get(':id')
  findOne(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.svc.findOne(req.user.id, id);
  }

  /** PATCH /shared-expenses/:id/settle/:userId */
  @Patch(':id/settle/:userId')
  settle(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.svc.settle(req.user.id, id, userId);
  }

  /** DELETE /shared-expenses/:id */
  @Delete(':id')
  remove(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.svc.remove(req.user.id, id);
  }
}
