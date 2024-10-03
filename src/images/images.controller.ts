import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MorphImageDto } from './dto/morph-image.dto';

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @ApiOperation({ summary: 'Morph image file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Post('morph')
  async morphImageFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() morphImageDto: MorphImageDto,
  ): Promise<string> {
    return this.imagesService.morphImageFile(file, morphImageDto);
  }
}
