import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MorphVideoDto } from './dto/morph-video.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('videos')
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @ApiOperation({ summary: 'Morph video file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ type: MorphVideoDto })
  @Post('morph')
  async morphVideoFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() morphVideoDto: MorphVideoDto,
  ): Promise<string> {
    return this.videosService.addVideoProcessingJob(file, morphVideoDto);
  }

  @ApiOperation({ summary: 'Check video processing job status' })
  @ApiParam({
    name: 'jobId',
    description: 'Job ID',
    required: true,
    type: 'string',
  })
  @Get('status/:jobId')
  async checkVideoJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<{ status: string; result?: string }> {
    return this.videosService.checkJobStatus(jobId);
  }
}
