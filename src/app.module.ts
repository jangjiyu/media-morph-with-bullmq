import { Module } from '@nestjs/common';
import { ImagesModule } from './images/images.module';
import { VideosModule } from './videos/videos.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/client', // '/client' 경로로 정적 파일 제공
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'morph_output_images'),
      serveRoot: '/output-images', // '/output-images' 경로로 정적 이미지 파일 제공
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'morph_output_videos'),
      serveRoot: '/output-videos', // '/output-videos' 경로로 정적 영상 파일 제공
    }),
    ImagesModule,
    VideosModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
