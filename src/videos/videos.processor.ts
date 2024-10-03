import {
  Injectable,
  OnModuleInit,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Worker, QueueEvents } from 'bullmq';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class VideoProcessor implements OnModuleInit {
  private readonly logger = new Logger(VideoProcessor.name);
  private redisConnection: any;

  constructor(private readonly configService: ConfigService) {
    // Redis 연결 정보를 ConfigService에서 가져옴
    this.redisConnection = {
      host: this.configService.get<string>('REDIS_HOST', 'redis'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    };
  }

  onModuleInit() {
    const queueEvents = new QueueEvents('video-processing', {
      connection: this.redisConnection,
    });

    queueEvents.on('completed', (jobId) => {
      this.logger.log(`Job ${jobId} has been completed`);
    });

    // Worker 설정 (큐에 등록된 작업 처리)
    const worker = new Worker(
      'video-processing',
      async (job) => {
        const { fileBuffer, morphVideoDto } = job.data;
        const { quality, ext, width } = morphVideoDto;

        // Buffer로 변환
        const buffer = Buffer.from(fileBuffer.data); // fileBuffer를 실제 Buffer로 변환

        // 임시 디렉토리에 파일 저장
        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, `${Date.now()}.tmp`);

        await writeFileAsync(inputPath, buffer);

        // FFmpeg 옵션 배열 초기화
        const ffmpegOption: string[] = ['-i', inputPath];

        // 비트레이트 및 품질 설정
        if (quality) {
          // Certified Rate Factor - H.264 및 H.265 비디오 인코딩에서 사용되는 품질 조절 방식, 파일 크기와 비디오 품질 간의 균형을 맞추는 역할 (0~51, 0이 최고 품질)
          let crf: number;
          // 비트레이트 설정 - 초당 전송되는 비트의 양, 높을수록 더 높은 품질의 비디오 생성
          let bitrate: string;

          switch (quality) {
            case 1:
              crf = 30; // 저화질
              bitrate = '300k';
              break;
            case 2:
              crf = 23; // 보통 품질
              bitrate = '500k';
              break;
            case 3:
              crf = 18; // 고화질
              bitrate = '1000k';
              break;
            default:
              throw new BadRequestException(
                'Invalid quality option. Choose between 1(low), 2(medium), or 3(high).',
              );
          }

          ffmpegOption.push('-b:v', bitrate);
          ffmpegOption.push('-crf', crf.toString());
        }

        if (width) ffmpegOption.push('-vf', `scale=${width}:-2`);

        // ext가 webm일 경우 WebM 포맷에 맞는 옵션 적용
        if (ext === 'webm') {
          ffmpegOption.push('-c:v', 'libvpx-vp9'); // VP9 비디오 코덱 사용
          ffmpegOption.push('-b:v', '1M'); // 비디오 비트레이트 설정
          ffmpegOption.push('-c:a', 'libopus'); // Opus 오디오 코덱 사용
          ffmpegOption.push('-b:a', '128k'); // 오디오 비트레이트 설정
        } else {
          // WebM이 아닌 경우 기존 H.264 코덱 적용
          ffmpegOption.push('-vcodec', 'libx264');
          ffmpegOption.push('-preset', 'medium');
          ffmpegOption.push('-movflags', 'faststart');
        }

        // 출력 형식 지정 (ext가 존재할 경우)
        const outputDir = path.resolve('morph_output_videos');
        const outputExt = ext ?? 'mp4'; // 기본 확장자를 'mp4'로 설정
        const fileName = Date.now();
        const outputPath = path.join(outputDir, `${fileName}.${outputExt}`);

        // video_output 폴더가 없으면 생성
        if (!fs.existsSync(outputDir))
          fs.mkdirSync(outputDir, { recursive: true });

        ffmpegOption.push('-f', outputExt);
        ffmpegOption.push('-loglevel', 'error', outputPath);

        // FFmpeg 프로세스 실행
        const ffmpegProcess = spawn('ffmpeg', ffmpegOption);

        // 프로세스 완료 여부 확인
        return new Promise((resolve, reject) => {
          let ffmpegErrorOccurred = false;

          // 에러 발생 시 로그 출력
          ffmpegProcess.stderr.on('data', (data) => {
            this.logger.error(`FFmpeg stderr: ${data}`);
            ffmpegErrorOccurred = true;
          });

          ffmpegProcess.on('close', async (code) => {
            if (code === 0 && !ffmpegErrorOccurred) {
              const baseUrl = this.configService.get<string>(
                'BASE_URL',
                'http://localhost:3000',
              );
              const resultPath = `${baseUrl}/output-videos/${fileName}.${ext}`;
              this.logger.log(`FFmpeg completed successfully: ${resultPath}`);

              resolve(resultPath);
            } else {
              if (fs.existsSync(outputPath)) await unlinkAsync(outputPath);
              reject(new Error('Video encoding failed.'));
            }
          });
        });
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
