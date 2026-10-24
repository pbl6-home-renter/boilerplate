import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'shared/decorators/api-success-response.decorator';
import { ResponseCode } from 'shared/decorators/response-code.decorator';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { SampleEntity } from '../../domain/entities/sample.entity';
import { CreateSampleCommand } from '../../use-case/commands/implements/sample-create.command';
import { DeleteSampleCommand } from '../../use-case/commands/implements/sample-delete.command';
import { GetSampleByIdQuery } from '../../use-case/queries/implements/sample-get-by-id.query';
import { SampleResponseCodeConstant } from '../constants/sample-response-code.constant';
import { CreateSampleRequest } from '../request/create-sample.request';
import { SampleResponseDto } from '../response/sample.response.dto';
import { Public, Roles } from 'shared/decorators/auth.decorators';
import { UserRole } from 'shared/domain/enums/user-role.enum';

@ApiTags('Samples')
@ApiBearerAuth()
@Controller('samples')
export class SampleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // Every route requires a valid access token by default (global JwtAuthGuard).
  @Post()
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ResponseCode(SampleResponseCodeConstant.SAMPLE_CREATED)
  @ApiOperation({
    operationId: 'createSample',
    summary: 'Create a new sample',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'INVALID_JSON, INVALID_REQUEST_BODY or BAD_REQUEST',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'VALIDATION_FAILED or UNEXPECTED_FIELD',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'INTERNAL_SERVER_ERROR',
  })
  @ApiSuccessResponse({
    status: HttpStatus.CREATED,
    code: SampleResponseCodeConstant.SAMPLE_CREATED,
    dataDto: SampleResponseDto,
  })
  async create(
    @Body() request: CreateSampleRequest,
  ): Promise<SampleResponseDto> {
    const sample: SampleEntity = await this.commandBus.execute(
      new CreateSampleCommand(request.title, request.description),
    );
    return SampleResponseDto.fromDomain(sample);
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ResponseCode(SampleResponseCodeConstant.SAMPLE_FETCHED)
  @ApiOperation({
    operationId: 'getSampleById',
    summary: 'Get sample by ID',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'INTERNAL_SERVER_ERROR',
  })
  @ApiSuccessResponse({
    code: SampleResponseCodeConstant.SAMPLE_FETCHED,
    dataDto: SampleResponseDto,
  })
  async getById(@Param('id') id: Uuid): Promise<SampleResponseDto> {
    const sample: SampleEntity = await this.queryBus.execute(
      new GetSampleByIdQuery(id),
    );
    return SampleResponseDto.fromDomain(sample);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseCode(SampleResponseCodeConstant.SAMPLE_DELETED)
  @ApiOperation({
    operationId: 'deleteSample',
    summary: 'Soft-delete a sample',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'INTERNAL_SERVER_ERROR',
  })
  @ApiSuccessResponse({
    status: HttpStatus.NO_CONTENT,
    code: SampleResponseCodeConstant.SAMPLE_DELETED,
  })
  async delete(@Param('id') id: Uuid): Promise<void> {
    await this.commandBus.execute(new DeleteSampleCommand(id));
  }
}
