import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseCode } from 'shared/decorators/response-code.decorator';
import { ApiSuccessResponse } from 'shared/decorators/api-success-response.decorator';
import { Public } from 'shared/decorators/auth.decorators';
import { SERVICE_PATH } from 'shared/constants/service.constants';

@ApiTags('Health')
@Public()
@Controller(`${SERVICE_PATH}/health`)
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseCode('HEALTH_CHECK_PASSED')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiSuccessResponse({
    code: 'HEALTH_CHECK_PASSED',
    description: 'Service is healthy',
  })
  async check(): Promise<void> {
    return;
  }
}
