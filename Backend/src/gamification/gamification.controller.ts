import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly svc: GamificationService) {}

  /** GET /gamification/badges — all badges + which ones I earned */
  @Get('badges')
  getBadges(@Req() req: { user: { id: string } }) {
    return this.svc.getBadgesForUser(req.user.id);
  }

  /** POST /gamification/evaluate — manually trigger re-evaluation */
  @Post('evaluate')
  evaluate(@Req() req: { user: { id: string } }) {
    return this.svc.evaluate(req.user.id);
  }
}
