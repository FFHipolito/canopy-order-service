import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { Public } from './public.decorator.js';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuário e obter Bearer Token JWT',
    description:
      'Gera um token de acesso JWT válido por 24h. Credenciais de teste: email "admin@canopy.com.br" / senha "Canopy#2026".',
  })
  @ApiOkResponse({
    description: 'Autenticação realizada com sucesso.',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas (e-mail ou senha incorretos).',
  })
  @ApiBadRequestResponse({
    description: 'Formato inválido de dados no payload de login.',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar perfil do usuário autenticado',
    description:
      'Endpoint protegido via JWT Strategy demonstrando a validação e extração de identidade do Bearer token.',
  })
  @ApiOkResponse({
    description: 'Dados do usuário decodificados a partir do token JWT.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido ou expirado.',
  })
  getProfile(@Request() req: any) {
    return req.user;
  }
}
