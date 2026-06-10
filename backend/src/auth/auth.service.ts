import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id,
      name: user.name 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        initials: user.initials,
        color: user.color,
      },
    };
  }

  async signup(signupDto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: signupDto.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(signupDto.password, 10);
    
    // Generate initials (e.g. "Maya Carter" -> "MC")
    const names = signupDto.name.split(' ');
    const initials = names.map(n => n[0] || '').join('').toUpperCase().substring(0, 2);

    // Pick a chart color randomly
    const colors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const user = await this.prisma.user.create({
      data: {
        email: signupDto.email,
        name: signupDto.name,
        passwordHash,
        initials: initials || 'US',
        color,
        online: true,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return this.login(userWithoutPassword);
  }
}
