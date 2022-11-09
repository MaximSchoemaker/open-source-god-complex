import fs from "fs";

// import 'dear-image.detect-background-color';
// import 'dear-image.detect-color-scheme';
// import DearImage from 'dear-image';

import getColors from "get-image-colors";
import Vibrant from 'node-vibrant'
import sizeOf from 'image-size';

import { exists } from "./utils.js";

import { promisify } from 'util'
sizeOf.setConcurrency(123456);
const sizeOfPromise = promisify(sizeOf);

export default async function metadata(source_path, target_path) {

   let prev_metadata = {};
   // try {
   //    prev_metadata = await exists(target_path)
   //       ? JSON.parse(await fs.promises.readFile(target_path))
   //       : {}
   // } catch (e) {
   //    console.error(target_path, e);
   //    prev_metadata = {};
   // }

   const [
      colors,
      palette,
      size
   ] = await Promise.all([
      prev_metadata.colors ? Promise.resolve(prev_metadata.colors) : getColors(source_path),
      prev_metadata.palette ? Promise.resolve(prev_metadata.palette) : Vibrant.from(source_path).getPalette(),
      prev_metadata.size ? Promise.resolve(prev_metadata.size) : sizeOfPromise(source_path)
   ]);

   const data = {
      ...prev_metadata,
      colors,
      palette,
      size,
   }

   await saveToJSON(target_path, data);
}

async function saveToJSON(path, data) {
   const json = JSON.stringify(data);
   await fs.promises.writeFile(path, json, 'utf8');
}