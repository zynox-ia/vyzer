import {
  CreateBucketCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  WorkspaceLogoMimeType,
  WorkspaceLogoObject,
  WorkspaceLogoStorage,
} from "./workspace-logo";

export type RustfsLogoStorageOptions = {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
};

function errorName(error: unknown): string | undefined {
  return error instanceof Error ? error.name : undefined;
}

export function createRustfsLogoStorage(options: RustfsLogoStorageOptions): WorkspaceLogoStorage {
  const client = new S3Client({
    endpoint: options.endpoint,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: options.accessKey,
      secretAccessKey: options.secretKey,
    },
  });

  let bucketReady: Promise<void> | undefined;
  const ensureBucket = () => {
    if (!bucketReady) {
      bucketReady = client
        .send(new CreateBucketCommand({ Bucket: options.bucket }))
        .then(() => undefined)
        .catch((error: unknown) => {
          if (["BucketAlreadyExists", "BucketAlreadyOwnedByYou"].includes(errorName(error) ?? "")) {
            return;
          }
          bucketReady = undefined;
          throw error;
        });
    }
    return bucketReady;
  };

  return {
    async put({ key, body, contentType }) {
      await ensureBucket();
      await client.send(
        new PutObjectCommand({
          Bucket: options.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    },
    async get(key): Promise<WorkspaceLogoObject | null> {
      await ensureBucket();
      try {
        const object = await client.send(
          new GetObjectCommand({ Bucket: options.bucket, Key: key }),
        );
        if (!object.Body) return null;

        const contentType = object.ContentType as WorkspaceLogoMimeType | undefined;
        return {
          body: new Uint8Array(await object.Body.transformToByteArray()),
          contentType: contentType ?? "image/png",
        };
      } catch (error) {
        if (["NoSuchKey", "NoSuchBucket", "NotFound"].includes(errorName(error) ?? "")) {
          return null;
        }
        throw error;
      }
    },
    close() {
      client.destroy();
    },
  };
}
