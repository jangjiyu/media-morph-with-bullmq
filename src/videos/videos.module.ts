import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { BullModule } from '@nestjs/bullmq';
import { VideoProcessor } from './videos.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'video-processing',
    }),
  ],
  controllers: [VideosController],
  providers: [VideosService, VideoProcessor],
})
export class VideosModule {}
