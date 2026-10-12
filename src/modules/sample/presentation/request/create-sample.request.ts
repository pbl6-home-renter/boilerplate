import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSampleRequest {
  @ApiProperty({ example: 'Sample Title', description: 'Title of the sample' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'Detailed description of the sample',
    description: 'Optional description',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
