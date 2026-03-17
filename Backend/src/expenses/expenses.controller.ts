import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(@Req() req: { user: { id: string; role: string } }) {
    const role = String(req.user.role || '').toLowerCase();
    if (role === 'admin' || role === 'advisor') {
      return this.expensesService.findAllUsersExpenses();
    }

    return this.expensesService.findAllForUser(req.user.id);
  }

  @Post()
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.user.id, dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.expensesService.remove(id, req.user.id);
  }
}
