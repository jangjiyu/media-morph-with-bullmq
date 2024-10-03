import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MorphVideoDto } from './dto/morph-video.dto';

@Injectable()
export class VideosService {
  constructor(
    @InjectQueue('video-processing') private readonly videoQueue: Queue,
  ) {}

  // 작업을 큐에 추가
  async addVideoProcessingJob(
    file: Express.Multer.File,
    morphVideoDto: MorphVideoDto,
  ): Promise<string> {
    const job = await this.videoQueue.add('process-video', {
      fileBuffer: file.buffer,
      fileMimetype: file.mimetype,
      morphVideoDto,
    });

    return job.id; // 작업 ID 반환
  }

  // 작업 상태 확인
  async checkJobStatus(
    jobId: string,
  ): Promise<{ status: string; result?: string }> {
    const job = await this.videoQueue.getJob(jobId);

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    if (job.isCompleted()) {
      const result = await job.returnvalue; // 완료된 경우 결과 반환
      return { status: 'completed', result };
    } else if (job.isFailed()) {
      return { status: 'failed' };
    } else {
      return { status: 'pending' };
    }
  }
}
