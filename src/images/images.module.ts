import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { ImageProcessor } from './images.processor';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'image-processing',
    }),
  ],
  controllers: [ImagesController],
  providers: [ImagesService, ImageProcessor],
})
export class ImagesModule {}
