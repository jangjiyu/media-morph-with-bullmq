import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  Body,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MorphImageDto } from './dto/morph-image.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @ApiOperation({ summary: 'Morph image file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: MorphImageDto })
  @UseInterceptors(FileInterceptor('file'))
  @Post('morph')
  async morphImageFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() morphImageDto: MorphImageDto,
  ): Promise<string> {
    return this.imagesService.addImageProcessingJob(file, morphImageDto);
  }

  @ApiOperation({ summary: 'Check image processing job status' })
  @ApiParam({
    name: 'jobId',
    description: 'Job ID',
    required: true,
    type: 'string',
  })
  @Get('status/:jobId')
  async checkJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<{ status: string; result?: string }> {
    return this.imagesService.checkJobStatus(jobId);
  }
}
