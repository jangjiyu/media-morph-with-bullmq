import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MorphImageDto } from './dto/morph-image.dto';

@Injectable()
export class ImagesService {
  constructor(
    @InjectQueue('image-processing') private readonly imageQueue: Queue,
  ) {}

  // 큐에 작업 추가
  async addImageProcessingJob(
    file: Express.Multer.File,
    morphImageDto: MorphImageDto,
  ): Promise<string> {
    const job = await this.imageQueue.add('process-image', {
      fileBuffer: file.buffer,
      fileMimetype: file.mimetype,
      morphImageDto,
    });

    return job.id; // 작업 ID 반환
  }

  // 작업 상태 확인
  async checkJobStatus(
    jobId: string,
  ): Promise<{ status: string; result?: string }> {
    const job = await this.imageQueue.getJob(jobId);

    if (!job) {
      throw new Error('Job not found');
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
