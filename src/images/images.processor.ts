import {
  Injectable,
  OnModuleInit,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Worker, QueueEvents } from 'bullmq';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { MorphImageExt } from './dto/morph-image.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImageProcessor implements OnModuleInit {
  private readonly logger = new Logger(ImageProcessor.name);
  private redisConnection: any;

  constructor(private readonly configService: ConfigService) {
    // Redis 연결 정보를 ConfigService에서 가져옴
    this.redisConnection = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    };
  }

  onModuleInit() {
    // 작업 큐 이벤트 리스너
    const queueEvents = new QueueEvents('image-processing', {
      connection: this.redisConnection,
    });

    queueEvents.on('completed', (jobId) => {
      this.logger.log(`Job ${jobId} has been completed`);
    });

    // Worker 설정 (큐에 등록된 작업 처리)
    const worker = new Worker(
      'image-processing',
      async (job) => {
        const { fileBuffer, fileMimetype, morphImageDto } = job.data;
        const { ext, width, height } = morphImageDto;

        // Buffer로 변환
        const buffer = Buffer.from(fileBuffer.data); // fileBuffer를 실제 Buffer로 변환

        const outputDir = path.resolve('morph_output_images');
        if (!fs.existsSync(outputDir))
          fs.mkdirSync(outputDir, { recursive: true });

        const fileName = Date.now();

        const outputPath = path.join(outputDir, `${fileName}.${ext}`);
        // sharp 객체 초기화
        let transformer = sharp(buffer, {
          animated:
            fileMimetype === 'image/gif' || fileMimetype === 'image/png'
              ? true
              : false,
        }).withMetadata();

        if (width && height)
          transformer = transformer.resize(width, height, { fit: 'fill' }); // 둘 다 있으면 지정된 크기로 resize. fill 옵션으로 이미지 비율 무시하고 지정된 크기로 변환
        else if (width)
          transformer = transformer.resize({ width }); // width만 있으면 비율에 맞춰 resize
        else if (height) transformer = transformer.resize({ height }); // height만 있으면 비율에 맞춰 resize

        const qualityOptions = {
          quality: 100,
          chromaSubsampling: '4:4:4',
        };

        // ext 포맷별 변환
        const formatMap = {
          [MorphImageExt.JPG]: () =>
            transformer.toFormat('jpg', qualityOptions),
          [MorphImageExt.PNG]: () =>
            transformer.toFormat('png', qualityOptions),
          [MorphImageExt.WEBP]: () =>
            transformer.toFormat('webp', qualityOptions),
          [MorphImageExt.GIF]: () =>
            transformer.toFormat('gif', { ...qualityOptions }),
        };

        if (!formatMap[ext])
          throw new BadRequestException('Unsupported image format');

        // 변환 실행 및 파일 저장
        await formatMap[ext]().toFile(outputPath);

        const baseUrl = this.configService.get<string>(
          'BASE_URL',
          'http://localhost:3000',
        );
        return `${baseUrl}/output-images/${fileName}.${ext}`;
      },
      {
        connection: this.redisConnection, // Redis 연결 정보 전달
      },
    );

    worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job.id} failed with error: ${err.message}`);
    });
  }
}
