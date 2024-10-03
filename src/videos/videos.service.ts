import * as fs from 'fs';
import { promisify } from 'util';
import { spawn } from 'child_process';
import { BadRequestException } from '@nestjs/common';
import { MorphVideoDto } from './dto/morph-video.dto';
import * as path from 'path';
import * as os from 'os';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

export class VideosService {
  constructor() {}

  async morphVideoFile(
    file: Express.Multer.File,
    morphVideoDto: MorphVideoDto,
  ): Promise<string> {
    const { quality, ext, width } = morphVideoDto;

    // 임시 디렉토리에 파일 저장
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `${Date.now()}-${file.originalname}`);

    await writeFileAsync(inputPath, file.buffer);

    // FFmpeg 옵션 배열 초기화
    const ffmpegOption: string[] = ['-i', inputPath];

    // 비트레이트 및 품질 설정
    if (quality !== undefined) {
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
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true }); // 폴더 생성 (재귀적으로 경로 생성)

    ffmpegOption.push('-f', outputExt);
    ffmpegOption.push('-loglevel', 'error', outputPath);

    // FFmpeg 프로세스 실행
    const ffmpegProcess = spawn('ffmpeg', ffmpegOption);

    // 프로세스 완료 여부 확인
    return new Promise((resolve, reject) => {
      let ffmpegErrorOccurred = false;

      // 에러 발생 시 로그 출력
      ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data}`);
        ffmpegErrorOccurred = true;
      });

      // 프로세스가 종료될 때
      ffmpegProcess.on('close', async (code) => {
        if (code === 0 && !ffmpegErrorOccurred) {
          // 정상적으로 종료되면 출력 파일 경로 반환
          const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
          resolve(`${baseUrl}/output-videos/${fileName}.${ext}`);
        } else {
          // 실패 시 파일 삭제 후 에러 반환
          if (fs.existsSync(outputPath)) await unlinkAsync(outputPath);
          reject(new BadRequestException('Video encoding failed.'));
        }
      });
    });
  }
}
