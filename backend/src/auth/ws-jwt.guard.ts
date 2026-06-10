import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      
      // Extract token from handshake auth or headers or query
      const authHeader = client.handshake.headers.authorization || client.handshake.auth?.token;
      
      if (!authHeader) {
        this.logger.warn('WebSocket connection attempt failed: No token provided');
        return false;
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : authHeader;

      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret: jwtSecret });
      
      // Attach user details to client for access in socket handlers
      client['user'] = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };

      return true;
    } catch (err) {
      this.logger.warn(`WebSocket authentication failed: ${err.message}`);
      throw new WsException('Unauthorized connection');
    }
  }
}
