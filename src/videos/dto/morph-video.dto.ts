import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export enum MorphVideoExt {
  MP4 = 'mp4',
  AVI = 'avi',
  WEBM = 'webm',
}

export class MorphVideoDto {
  @ApiProperty({
    description: '영상 파일',
    type: 'string',
    format: 'binary',
    required: true,
  })
  file: Express.Multer.File; // swagger 설정을 위해 추가한 것으로 validate에서는 사용되지 않음

  @ApiProperty({
    description: '영상 품질. 현재 1~3만 존재하며, 높을수록 품질이 좋아짐',
    type: 'number',
    example: 2,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  quality: number;

  @ApiProperty({
    description: '변환할 확장자',
    enum: MorphVideoExt,
    default: MorphVideoExt.MP4,
    required: false,
  })
  @IsOptional()
  @IsEnum(MorphVideoExt)
  ext: string;

  @ApiProperty({
    description: '비디오 파일 너비',
    type: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  width: number;

  constructor(quality: number, ext?: string, width?: number) {
    this.quality = quality;
    this.ext = ext;
    this.width = width;
  }
}
