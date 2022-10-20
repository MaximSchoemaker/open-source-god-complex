import PATH from 'path';

import Crawl from "./crawl.js";
import Import from "./import.js";
import { ask, formatBytes } from "./utils.js";


await Compile();
console.log("COMPILATION DONE!")

async function Compile() {
   {
      const import_path = "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\rendr";
      const import_target_dir = "public\\compiled\\rendr"
      const import_width = 1080;
      const import_height = 1080;
      const import_override = false;
      const imported_items = await runImport(import_path, import_target_dir, import_width, import_height, import_override);
      console.log({ imported_items }, "\n");
   }
   {
      const import_path = "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots";
      const import_target_dir = "public\\compiled\\graphics_screenshots"
      const import_width = 1080;
      const import_height = 1080;
      const import_override = false;
      const imported_items = await runImport(import_path, import_target_dir, import_width, import_height, import_override);
      console.log({ imported_items }, "\n");
   }
   {
      const import_path = "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\videos";
      const import_target_dir = "public\\compiled\\graphics_videos"
      const import_width = 1080;
      const import_height = 1080;
      const import_override = false;
      const imported_items = await runImport(import_path, import_target_dir, import_width, import_height, import_override);
      console.log({ imported_items }, "\n");
   }

   const meta_path = "public\\compiled";
   const meta_sizes = [
      { width: 512, height: 512 },
      { width: 256, height: 256 },
      { width: 128, height: 128 },
      { width: 64, height: 64 },
      { width: 32, height: 32 },
      { width: 16, height: 16 },
      { width: 8, height: 8 },
      { width: 4, height: 4 },
      { width: 2, height: 2 },
   ]
   const meta_override = false;
   const metaed_items = await runMeta(meta_path, meta_sizes, meta_override);
   console.log({ metaed_items }, "\n");
}

async function runImport(path, target_dir, width, height, override) {
   const items = await Crawl(
      path,
      { properties: { isDir: false, } },
      {
         ignore: [
            "\\swarm\\session",
            //  "\\flock\\"
         ]
      }
   );

   // items.sort((i1, i2) => i1.metadata.size - i2.metadata.size);

   // console.log({ items });
   console.log("total items:", items.length);

   if (await ask("import? y/n: ") != "y")
      return;

   return await Import(items, [
      {
         profile: { properties: { extension: ".mp4" } },
         action: {
            kind: "copy",
            override,
            get_target_path: (item) => PATH.join(
               target_dir,
               "videos",
               item.crawl_relative_path
            ),
         },
      },
      {
         profile: { properties: { extension: ".png" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(
               target_dir,
               "images"
               , item.crawl_relative_dir,
               `${item.filename} ${width}x${height}.jpg`
            ),
            get_ffmpeg_args: (path, target_path) => [
               '-y',
               "-i", path,
               "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase`,
               target_path
            ]
         }
      },
   ]);
}


async function runMeta(path, sizes, override) {
   const items = await Crawl(
      path,
      { properties: { isDir: false } },
      { ignore: ["\\_meta\\"] },
   );

   // items.sort((i1, i2) => i1.metadata.size - i2.metadata.size);

   items.forEach(i => console.log(`${formatBytes(i.metadata.size)} - ${i.filename_with_extension}`));
   const totalSize = items.reduce((tot, i) => tot + i.metadata.size, 0);
   console.log({ items: items.length, size: formatBytes(totalSize) });
   if (await ask("meta? y/n: ") != "y")
      return;

   const profileActions = [
      ...sizes.map(({ width, height }) => ({
         profile: { properties: { extension: ".mp4" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(
               item.directory,
               "_meta",
               `${item.filename} ${width}x${height}.gif`
            ),
            get_ffmpeg_args: (path, target_path) => [
               '-y',
               "-t", "60",
               "-i", path,
               "-vf", `fps=50,scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
               target_path
            ]
         }
      })),

      ...sizes.map(({ width, height }) => ({
         profile: { properties: { extension: ".jpg" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(
               item.directory,
               "_meta",
               `${item.filename} ${width}x${height}.jpg`
            ),
            get_ffmpeg_args: (path, target_path) => [
               '-y',
               "-i", path,
               "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase`,
               target_path
            ]
         }
      })),
   ]

   return await Import(items, profileActions);
}
