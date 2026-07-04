import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

export const S3_CONFIG_KEY = 's3_gateway_config';

export interface S3Config {
  bucketName: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  /**
   * Public-facing base URL that serves objects directly (e.g. a CDN domain
   * mapped to the bucket, like https://cdn.boilerbites.com). Unlike `endpoint`
   * (the signed S3 API), this domain resolves the bucket implicitly, so the
   * bucket name is NOT part of the object path.
   */
  publicBaseUrl: string;
}

export const EMPTY_S3_CONFIG: S3Config = {
  bucketName: '',
  region: '',
  endpoint: '',
  accessKeyId: '',
  secretAccessKey: '',
  publicBaseUrl: '',
};

/** A single object living under a folder prefix. */
export interface PendingObject {
  key: string;
  fileName: string;
  url: string;
  lastModified?: Date;
}

/** A folder/ID group that contains pending photos and/or a published image. */
export interface PendingGroup {
  id: string;
  pending: PendingObject[];
  /** The currently published image for this id, if one exists. */
  published: PendingObject | null;
}

export function loadConfig(): S3Config | null {
  try {
    const raw = window.localStorage.getItem(S3_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<S3Config>;
    if (!parsed.bucketName || !parsed.accessKeyId || !parsed.secretAccessKey) {
      return null;
    }
    return { ...EMPTY_S3_CONFIG, ...parsed };
  } catch (error) {
    console.error('Error loading S3 config from localStorage:', error);
    return null;
  }
}

export function saveConfig(config: S3Config): void {
  window.localStorage.setItem(S3_CONFIG_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
  window.localStorage.removeItem(S3_CONFIG_KEY);
}

export function createClient(config: S3Config): S3Client {
  return new S3Client({
    region: config.region || 'us-east-1',
    endpoint: config.endpoint || undefined,
    // Required for R2/MinIO and most non-AWS S3-compatible endpoints.
    forcePathStyle: !!config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/** Build a publicly-addressable URL for an object. */
function buildObjectUrl(config: S3Config, key: string): string {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  // Prefer the dedicated public/CDN domain. It maps straight to the bucket, so
  // the object path does not include the bucket name.
  if (config.publicBaseUrl) {
    const base = config.publicBaseUrl.replace(/\/+$/, '');
    return `${base}/${encodedKey}`;
  }
  if (config.endpoint) {
    const base = config.endpoint.replace(/\/+$/, '');
    return `${base}/${config.bucketName}/${encodedKey}`;
  }
  return `https://${config.bucketName}.s3.${config.region || 'us-east-1'}.amazonaws.com/${encodedKey}`;
}

/** Extract the root folder/ID prefix from an object key, e.g. `user_456/x.jpg` -> `user_456`. */
function rootPrefix(key: string): string {
  const idx = key.indexOf('/');
  return idx === -1 ? key : key.slice(0, idx);
}

/** Fixed, extension-stable name every approved image is published under. */
export const PUBLISHED_FILE = 'published.img.jpg';

function isPending(key: string): boolean {
  const fileName = key.slice(key.lastIndexOf('/') + 1);
  return /pending_\d+/.test(fileName);
}

function isPublished(key: string): boolean {
  return key.slice(key.lastIndexOf('/') + 1) === PUBLISHED_FILE;
}

/**
 * List every object in the bucket, group by root folder prefix, and keep any
 * group that contains at least one `pending_[timestamp]` file and/or a
 * published image.
 */
export async function scanPendingGroups(config: S3Config): Promise<PendingGroup[]> {
  const client = createClient(config);
  const groups = new Map<string, { pending: PendingObject[]; published: PendingObject | null }>();

  const groupFor = (id: string) => {
    let group = groups.get(id);
    if (!group) {
      group = { pending: [], published: null };
      groups.set(id, group);
    }
    return group;
  };

  const toObject = (item: { Key?: string; LastModified?: Date }, key: string): PendingObject => ({
    key,
    fileName: key.slice(key.lastIndexOf('/') + 1),
    url: buildObjectUrl(config, key),
    lastModified: item.LastModified,
  });

  let continuationToken: string | undefined;
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        ContinuationToken: continuationToken,
      })
    );

    for (const item of response.Contents ?? []) {
      const key = item.Key;
      if (!key) continue;

      if (isPending(key)) {
        groupFor(rootPrefix(key)).pending.push(toObject(item, key));
      } else if (isPublished(key)) {
        groupFor(rootPrefix(key)).published = toObject(item, key);
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return Array.from(groups.entries())
    .map(([id, { pending, published }]) => ({
      id,
      pending: pending.sort((a, b) => a.fileName.localeCompare(b.fileName)),
      published,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Delete every pending image for a group, leaving any published image intact. */
export async function discardPending(config: S3Config, group: PendingGroup): Promise<void> {
  if (group.pending.length === 0) return;
  const client = createClient(config);
  await client.send(
    new DeleteObjectsCommand({
      Bucket: config.bucketName,
      Delete: { Objects: group.pending.map((obj) => ({ Key: obj.key })) },
    })
  );
}

/** Delete the published image for a group, leaving any pending images intact. */
export async function deletePublished(config: S3Config, group: PendingGroup): Promise<void> {
  if (!group.published) return;
  const client = createClient(config);
  await client.send(
    new DeleteObjectsCommand({
      Bucket: config.bucketName,
      Delete: { Objects: [{ Key: group.published.key }] },
    })
  );
}

/**
 * Promote the chosen pending image to `id/published.jpg`, then delete every
 * pending file in that group (including the one that was just promoted).
 */
export async function approvePhoto(
  config: S3Config,
  group: PendingGroup,
  chosen: PendingObject
): Promise<void> {
  const client = createClient(config);
  // Always publish under a single, extension-stable name so Cloudflare's image
  // resizer can address it uniformly regardless of the source format.
  const publishedKey = `${group.id}/${PUBLISHED_FILE}`;

  await client.send(
    new CopyObjectCommand({
      Bucket: config.bucketName,
      CopySource: `/${config.bucketName}/${chosen.key}`,
      Key: publishedKey,
    })
  );

  const toDelete = group.pending
    .map((obj) => ({ Key: obj.key }))
    // Never delete the freshly published object (in case a pending key collides).
    .filter((obj) => obj.Key !== publishedKey);

  if (toDelete.length > 0) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: config.bucketName,
        Delete: { Objects: toDelete },
      })
    );
  }
}
