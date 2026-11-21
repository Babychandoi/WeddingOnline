"""Bake local relative-depth textures for reference photos. Model: Depth Anything V2 Small ONNX (Apache-2.0)."""

import argparse
from pathlib import Path
import re

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps


def pixel_values(image, input_shape):
    width, height = image.size
    # The encoder splits its input into 14-pixel patches.
    scale = min(406 / max(width, height), 294 / min(width, height))
    rows = input_shape[2] if isinstance(input_shape[2], int) else max(112, round(height * scale / 14) * 14)
    cols = input_shape[3] if isinstance(input_shape[3], int) else max(112, round(width * scale / 14) * 14)
    rgb = np.asarray(image.resize((cols, rows), Image.Resampling.BICUBIC), dtype=np.float32) / 255
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    deviation = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    return np.ascontiguousarray(((rgb - mean) / deviation).transpose(2, 0, 1)[None])


def bake(session, source, target):
    model_input = session.get_inputs()[0]
    with Image.open(source) as file:
        image = ImageOps.exif_transpose(file).convert('RGB')
    inverse = np.asarray(session.run(None, {model_input.name: pixel_values(image, model_input.shape)})[0]).squeeze()
    if inverse.ndim != 2 or not np.isfinite(inverse).all():
        raise ValueError(f'{source.name}: invalid depth map')
    far, near = np.percentile(inverse, [1.5, 98.5])
    if near - far < 1e-5:
        raise ValueError(f'{source.name}: depth lacks detail')
    values = np.clip((inverse - far) / (near - far), 0, 1)
    depth = Image.fromarray(np.rint(values * 255).astype(np.uint8))
    depth.thumbnail((192, 192), Image.Resampling.LANCZOS)
    target.parent.mkdir(parents=True, exist_ok=True)
    temp = target.with_suffix('.tmp')
    depth.save(temp, 'WEBP', lossless=True)
    temp.replace(target)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', required=True, type=Path)
    parser.add_argument('--photos', type=Path, default=Path('apps/web/public/assets/venue-references'))
    parser.add_argument('--output', type=Path)
    parser.add_argument('--threads', type=int, default=3)
    arguments = parser.parse_args()
    output = arguments.output or arguments.photos
    images = sorted(p for p in arguments.photos.glob('*.webp') if re.fullmatch('[a-z0-9_]+', p.stem))
    targets = [(source, output / f'{source.stem}.depth.webp') for source in images]
    pending = [(source, target) for source, target in targets if not target.exists() or target.stat().st_mtime < source.stat().st_mtime]
    if pending:
        options = ort.SessionOptions()
        options.intra_op_num_threads = arguments.threads
        session = ort.InferenceSession(str(arguments.model), options, providers=['CPUExecutionProvider'])
        for source, target in pending:
            bake(session, source, target)
            print(target.name, flush=True)
    print(f'{len(targets)} depth textures available', flush=True)


if __name__ == '__main__':
    main()
