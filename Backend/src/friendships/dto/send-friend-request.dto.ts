import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendFriendRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
