import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.users.findByUsername(username.trim());
    const matches =
      user &&
      user.isActive &&
      (await bcrypt.compare(password, user.passwordHash));
    if (!matches) {
      throw new UnauthorizedException('Invalid username or password.');
    }
    const payload = { sub: user.id, name: user.fullName, role: user.role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      name: user.fullName,
      role: user.role,
    };
  }

  me(userId: string) {
    return this.users.findById(userId);
  }
}
