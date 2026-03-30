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
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@Controller('friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
  constructor(private readonly svc: FriendshipsService) {}

  /** POST /friendships/request — send a friend request by email */
  @Post('request')
  sendRequest(
    @Req() req: { user: { id: string } },
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.svc.sendRequest(req.user.id, dto);
  }

  /** GET /friendships — list friends + pending requests */
  @Get()
  findAll(@Req() req: { user: { id: string } }) {
    return this.svc.findAll(req.user.id);
  }

  /** PATCH /friendships/:id/accept */
  @Patch(':id/accept')
  accept(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.svc.accept(req.user.id, id);
  }

  /** PATCH /friendships/:id/reject */
  @Patch(':id/reject')
  reject(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.svc.reject(req.user.id, id);
  }

  /** DELETE /friendships/:id */
  @Delete(':id')
  remove(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.svc.remove(req.user.id, id);
  }
}
