import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Public } from '../common/decorators/auth.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user.sub);
  }
}
