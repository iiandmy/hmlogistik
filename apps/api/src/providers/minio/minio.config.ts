import { registerAs } from '@nestjs/config';

export default registerAs('minio', () => ({
    endpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    bucket: process.env.MINIO_BUCKET ?? 'transfer-files',
    useSSL: process.env.MINIO_USE_SSL === 'true',
}));
