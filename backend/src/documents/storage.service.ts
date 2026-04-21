import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: config.get('AWS_REGION', 'ap-south-1'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', ''),
      },
      // Support S3-compatible (MinIO, Cloudflare R2)
      ...(config.get('S3_ENDPOINT')
        ? { endpoint: config.get('S3_ENDPOINT'), forcePathStyle: true }
        : {}),
    });
    this.bucket = config.get('S3_BUCKET', 'litigation-os');
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    prefix: string = 'documents',
  ): Promise<{ key: string; bucket: string; url: string }> {
    const ext = originalName.split('.').pop();
    const key = `${prefix}/${uuidv4()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
        Metadata: { originalName },
      }),
    );

    const url = `https://${this.bucket}.s3.amazonaws.com/${key}`;
    return { key, bucket: this.bucket, url };
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async getSignedUploadUrl(
    key: string,
    mimeType: string,
    expiresIn = 900,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  generateKey(prefix: string, originalName: string): string {
    const ext = originalName.split('.').pop();
    return `${prefix}/${uuidv4()}.${ext}`;
  }
}
