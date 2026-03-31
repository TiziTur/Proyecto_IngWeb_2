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
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly svc: GoalsService) {}

  /** GET /goals — list my saving goals */
  @Get()
  findAll(@Req() req: { user: { id: string } }) {
    return this.svc.findAll(req.user.id);
  }

  /** POST /goals — create a new saving goal */
  @Post()
  create(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateGoalDto,
  ) {
    return this.svc.create(req.user.id, dto);
  }

  /** PATCH /goals/:id — update name, target, saved amount, deadline */
  @Patch(':id')
  update(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.svc.update(req.user.id, id, dto);
  }

  /** DELETE /goals/:id — delete a goal */
  @Delete(':id')
  remove(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.svc.remove(req.user.id, id);
  }
}
