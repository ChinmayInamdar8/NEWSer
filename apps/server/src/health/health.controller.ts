import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}
  @Get('status')
  @HttpCode(HttpStatus.OK)
  getHealth() {
    return {
      statusCode: HttpStatus.OK,
      data: this.healthService.getHealthService(),
    };
  }
}
