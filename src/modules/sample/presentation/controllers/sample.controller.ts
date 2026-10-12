import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseCode } from 'shared/decorators/response-code.decorator';
import { CreateSampleRequest } from '../request/create-sample.request';
import { SampleResponseDto } from '../response/sample.response.dto';
import { CreateSampleCommand } from '../../use-case/commands/create-sample.command';
import { GetSampleByIdQuery } from '../../use-case/queries/get-sample-by-id.query';
import { SampleEntity } from '../../domain/entities/sample.entity';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';

@ApiTags('Samples')
@Controller('samples')
export class SampleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseCode('SAMPLE_CREATED')
  @ApiOperation({ summary: 'Create a new sample' })
  @ApiResponse({ status: 201, type: SampleResponseDto })
  async create(
    @Body() request: CreateSampleRequest,
  ): Promise<SampleResponseDto> {
    const sample: SampleEntity = await this.commandBus.execute(
      new CreateSampleCommand(request.title, request.description),
    );
    return SampleResponseDto.fromDomain(sample);
  }

  @Get(':id')
  @ResponseCode('SAMPLE_FETCHED')
  @ApiOperation({ summary: 'Get sample by ID' })
  @ApiResponse({ status: 200, type: SampleResponseDto })
  async getById(@Param('id') id: Uuid): Promise<SampleResponseDto> {
    const sample: SampleEntity = await this.queryBus.execute(
      new GetSampleByIdQuery(id),
    );
    return SampleResponseDto.fromDomain(sample);
  }
}
