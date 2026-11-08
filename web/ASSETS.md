# Asset credits

## Nike Air Mag

- **Author:** pandan — https://sketchfab.com/pandan
- **Model:** “Nike Air Mag” — https://sketchfab.com/3d-models/nike-air-mag-15ef47bad0aa4666b459cf78261abce5
- **License:** Creative Commons Attribution 4.0 International — https://creativecommons.org/licenses/by/4.0/
- **Retrieved from:** https://github.com/nailtonvital/3D-nike-air-mag-store/blob/main/nike.gltf
- **Changes:** embedded glTF repackaged as GLB without changing geometry/textures; scene orientation, lighting, presentation and runtime color tint adjusted. `air-mag-thumb.png` is a render of this model.

## Footwear imagery

`air-max.png`, `air-max-green.png`, `air-max-blue.png` are the `big-shoe1.png`, `big-shoe2.png`, `big-shoe3.png` assets from Adrian Hajdin’s educational Nike landing page project:

https://github.com/adrianhajdin/nike_landing_page/tree/main/src/assets/images

Nike product names and the swoosh are used for this independent reference recreation. The concept is not an official Nike storefront.

## Generated artwork

`lookbook.png`, `highlands.png` and `garments-cutout.png` were generated for this implementation. They replace the unavailable original photography in the reference video. The original generated files remain under `/workspace/generated_images/` in this session.

## Fonts and libraries

- DM Sans — https://github.com/googlefonts/dm-fonts — SIL Open Font License 1.1.
- Barlow Condensed — https://github.com/jpt/barlow — SIL Open Font License 1.1.
- Three.js — https://github.com/mrdoob/three.js — MIT.
- Draco decoder — distributed with Three.js, Google Draco, Apache 2.0.
- GSAP — https://gsap.com/community/standard-license/ — GSAP Standard License.

Full dependency license files are included in the installed packages. Asset credits are also accessible from the website footer.

## Mầm chữ learning extension

The three seed models are procedural Three.js geometry in `src/learning/seed-scene.js`; the character illustrations and interface icons are authored SVG in `src/learning/icons.js`. The garden continues to use the generated `highlands.png` landscape credited above. Original models, photographs, decoders and the entire original application remain available at `/original.html`. `docs/preview.png` is a screenshot of the learning application, without student personal information.

`public/assets/garden-accents.svg` is an authored vector illustration of leaves and flowers for the colourful learning theme. Its sun, sky and hills are CSS backgrounds in `src/learning/garden-theme.css`; the interactive seed models remain unchanged.
