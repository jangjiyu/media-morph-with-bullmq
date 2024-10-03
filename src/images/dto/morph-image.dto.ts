import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export enum MorphImageExt {
  JPG = 'jpg',
  PNG = 'png',
  WEBP = 'webp',
  GIF = 'gif',
}

export class MorphImageDto {
  @ApiProperty({
    description: '이미지 파일',
    type: 'string',
    format: 'binary',
    required: true,
  })
  file: Express.Multer.File; // swagger 설정을 위해 추가한 것으로 validate에서는 사용되지 않음

  @ApiProperty({
    description: '변환할 확장자',
    enum: MorphImageExt,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(MorphImageExt)
  ext: string;

  @ApiProperty({
    description:
      '이미지 파일 너비. 없을 경우 높이에 맞춰서 비율을 유지함. 둘 다 없을 경우 기존 이미지 크기 유지',
    type: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  width: number;

  @ApiProperty({
    description: '이미지 파일 높이. 없을 경우 너비에 맞춰서 비율을 유지함',
    type: 'number',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  height: number;

  constructor(ext: string, width?: number, height?: number) {
    this.ext = ext;
    this.width = width;
    this.height = height;
  }
}
