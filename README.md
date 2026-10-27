# Perspective Lab

[Open the app](https://kmatzen.com/perspective-lab/)

Drop or paste an image to explore automatically detected straight edges, vanishing-point families, convergence rays, and unexplained segments. Compare with the original, adjust angular tolerance, and export the canvas as PNG. All image analysis runs locally in a browser worker; images are not uploaded.

## Run locally

No build step or dependencies are required.

```sh
python3 -m http.server 8765 --directory dist
```

Open http://localhost:8765.

## Test

```sh
node tests/engine.test.mjs
```

Use Node.js 22 or newer. Tests cover finite convergence, parallel directions, empty scenes, pixel edge detection, and conflicting directions.

## Method and limitations

The app resizes the image to a maximum dimension of 720 pixels, extracts edges using image gradients and a direction-constrained Hough accumulator, then fits up to three projective direction families. The agreement score measures the fraction of detected segment length explained within the angular tolerance. It is not a probability of perspective correctness. Texture, distortion, rotated objects, missed edges, and sparse evidence affect the result. Nearby hypotheses may describe the same physical direction.

## Deployment

Pushes to `main` run the geometry tests and deploy `dist/` through GitHub Actions to GitHub Pages. The project inherits the custom domain of `kmatzen/kmatzen.github.io` and is served at `/perspective-lab/`. Do not add a project CNAME for the apex domain.
