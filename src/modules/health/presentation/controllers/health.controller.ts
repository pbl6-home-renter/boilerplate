import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseCode } from 'shared/decorators/response-code.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor() {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseCode('HEALTH_CHECK_PASSED')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  async check(): Promise<void> {
    return;
  }
}
