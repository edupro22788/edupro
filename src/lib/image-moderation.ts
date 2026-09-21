import path from 'node:path';
import * as tf from '@tensorflow/tfjs';
import * as tfwasm from '@tensorflow/tfjs-backend-wasm';
import * as nsfwjs from 'nsfwjs';
import * as faceapi from '@vladmandic/face-api/dist/face-api.node-wasm.js';
import sharp from 'sharp';

const NSFW_LIMITS: Record<string, number> = {
  Porn: 0.5,
  Hentai: 0.5,
  Sexy: 0.6,
};

const FEMALE_PROBABILITY_LIMIT = 0.6;
const FACE_SCORE_THRESHOLD = 0.4;

type ReadyState = { nsfw: nsfwjs.NSFWJS };

let readyPromise: Promise<ReadyState> | null = null;

async function init(): Promise<ReadyState> {
  const wasmDir = path.join(
    process.cwd(),
    'node_modules',
    '@tensorflow',
    'tfjs-backend-wasm',
    'dist',
  );
  tfwasm.setWasmPaths(wasmDir + path.sep);
  await tf.setBackend('wasm').catch(() => undefined);

  const modelDir = path.join(
    process.cwd(),
    'node_modules',
    '@vladmandic',
    'face-api',
    'model',
  );
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelDir + path.sep);
  await faceapi.nets.ageGenderNet.loadFromDisk(modelDir + path.sep);

  const nsfw = await nsfwjs.load();
  return { nsfw };
}

function ensureReady(): Promise<ReadyState> {
  if (!readyPromise) readyPromise = init();
  return readyPromise;
}

let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export type ImageModerationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export async function moderateImage(buffer: Buffer): Promise<ImageModerationResult> {
  try {
    return await moderate(buffer);
  } catch (error) {
    console.error('[image-moderation] فشل فحص الصورة:', error);
    return { ok: false, reason: 'تعذّر فحص الصورة، أعد المحاولة' };
  }
}

async function moderate(buffer: Buffer): Promise<ImageModerationResult> {
  const { nsfw } = await ensureReady();

  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const tensor = tf.tensor3d(
    new Uint8Array(data),
    [info.height, info.width, 3],
    'int32',
  );

  try {
    return await serialize(async () => {
      const predictions = await nsfw.classify(tensor, 5);
      for (const prediction of predictions) {
        const limit = NSFW_LIMITS[prediction.className];
        if (limit !== undefined && prediction.probability >= limit) {
          return { ok: false as const, reason: 'ممنوع رفع صور غير لائقة' };
        }
      }

      const detections = await faceapi
        .detectAllFaces(
          tensor as unknown as Parameters<typeof faceapi.detectAllFaces>[0],
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: FACE_SCORE_THRESHOLD,
          }),
        )
        .withAgeAndGender();

      const hasFemale = detections.some(
        (detection) =>
          detection.gender === faceapi.Gender.FEMALE &&
          detection.genderProbability >= FEMALE_PROBABILITY_LIMIT,
      );
      if (hasFemale) {
        return { ok: false as const, reason: 'ممنوع رفع صور النساء' };
      }

      return { ok: true as const };
    });
  } finally {
    tensor.dispose();
  }
}
