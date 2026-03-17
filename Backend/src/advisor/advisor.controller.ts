import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/role.enum';
import { AdvisorService } from './advisor.service';
import { AdvisorAskDto } from './dto/advisor-ask.dto';

@Controller('advisor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADVISOR, Role.ADMIN)
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) {}

  @Get('overview')
  overview() {
    return this.advisorService.getGlobalOverview();
  }

  @Get('overview/:userId')
  userOverview(@Param('userId') userId: string) {
    return this.advisorService.getUserOverview(userId);
  }

  @Get('patterns/:userId')
  patternsV2(@Param('userId') userId: string) {
    return this.advisorService.getUserPatterns(userId);
  }

  @Get('users/:userId/patterns')
  patterns(@Param('userId') userId: string) {
    return this.advisorService.getUserPatterns(userId);
  }

  @Post('ask')
  ask(@Req() req: { user: { id: string } }, @Body() dto: AdvisorAskDto) {
    return this.advisorService.askAdvisor(req.user.id, dto);
  }

  @Get('recommendations/:userId')
  recommendations(@Param('userId') userId: string) {
    return this.advisorService.getRecommendationHistory(userId);
  }

  @Get('clients/health')
  clientsHealth() {
    return this.advisorService.getClientsHealth();
  }
}
