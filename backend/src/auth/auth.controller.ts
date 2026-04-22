import { Controller, Post, Body } from '@nestjs/common';

@Controller('auth')
export class AuthController {

  @Post('register')
  register(@Body() dto: any) {
    return {
      access_token: 'demo-token',
      user: {
        id: 'demo-user',
        email: dto?.email || 'demo@demo.com',
      },
    };
  }

  @Post('login')
  login(@Body() dto: any) {
    return {
      access_token: 'demo-token',
      user: {
        id: 'demo-user',
        email: dto?.email || 'demo@demo.com',
      },
    };
  }

  @Post('demo-login')
  demoLogin() {
    return {
      access_token: 'demo-token',
      user: {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@demo.com',
      },
    };
  }
}
