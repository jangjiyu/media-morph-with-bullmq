import * as sharp from 'sharp';
import { MorphImageDto, MorphImageExt } from './dto/morph-image.dto';
import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';

export class ImagesService {
  constructor() {}

  async morphImageFile(
    file: Express.Multer.File,
    morphImageDto: MorphImageDto,
  ): Promise<string> {
    const { ext, width, height } = morphImageDto;

    const outputDir = path.resolve('morph_output_images');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true }); // output 디렉토리 생성

    const fileName = Date.now();

    const outputPath = path.join(outputDir, `${fileName}.${ext}`);
    // sharp 객체 초기화
    let transformer = sharp(file.buffer, {
      animated:
        file.mimetype === 'image/gif' || file.mimetype === 'image/png'
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
      [MorphImageExt.JPG]: () => transformer.toFormat('jpg', qualityOptions),
      [MorphImageExt.PNG]: () => transformer.toFormat('png', qualityOptions),
      [MorphImageExt.WEBP]: () => transformer.toFormat('webp', qualityOptions),
      [MorphImageExt.GIF]: () =>
        transformer.toFormat('gif', { ...qualityOptions }),
    };

    if (!formatMap[ext])
      throw new BadRequestException('Unsupported image format');

    // 변환 실행 및 파일 저장
    await formatMap[ext]().toFile(outputPath);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/output-images/${fileName}.${ext}`;
  }
}
