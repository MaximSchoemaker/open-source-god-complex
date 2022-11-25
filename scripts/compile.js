import fs from 'fs';
import PATH from 'path';

import Crawl, { checkProfile } from "./crawl.js";
import Import from "./import.js";
import { ask, formatBytes, exists, ensureDir } from "./utils.js";


await Compile();
console.log("COMPILATION DONE!")

async function Compile() {
   // const item_settings = [
   //    {
   //       path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\rendr",
   //       profile: {},
   //       options: {},
   //       target_dir: "public\\compiled\\rendr",
   //       width: 1080, height: 1080, override: false
   //    },
   //    {
   //       path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots",
   //       profile: {},
   //       options: { ignore: ["\\swarm\\session"] },
   //       target_dir: "public\\compiled\\graphics_screenshots",
   //       width: 1080, height: 1080, override: false
   //    },
   //    {
   //       path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\videos",
   //       profile: {},
   //       options: { ignore: ["\\shepherd\\", "\\phone\\"] },
   //       target_dir: "public\\compiled\\graphics_videos",
   //       width: 1080, height: 1080, override: false
   //    }
   // ]

   // for (const settings of item_settings) {
   //    const { path, profile, options, target_dir, width, height, override } = settings;

   //    const compiled_items = await compileItems(path, profile, options, target_dir, width, height, override);
   //    compiled_items && console.log("count:", compiled_items.length);
   // };

   const mipmap_path = "public\\archive";
   const mipmap_profile = {};
   const mipmap_options = {};
   const mipmap_sizes = [
      // { width: 512, height: 512 },
      { width: 256, height: 256 },
      { width: 128, height: 128 },
      { width: 64, height: 64 },
      { width: 32, height: 32 },
      { width: 16, height: 16 },
      { width: 8, height: 8 },
      { width: 4, height: 4 },
      { width: 2, height: 2 },
   ]
   const mipmap_override = false;

   const compiled_mipmaps = await compileMipmaps(mipmap_path, mipmap_profile, mipmap_options, mipmap_sizes, mipmap_override);
   if (compiled_mipmaps) {
      const succeeded_items = compiled_mipmaps.filter(item => !item.error);
      const failed_items = compiled_mipmaps.filter(item => item.error);
      console.log("failed:", { items: failed_items.length });

      const totalSize = succeeded_items.reduce((tot, i) => tot + i.metadata.size, 0);
      console.log("succeeded:", { items: succeeded_items.length, size: formatBytes(totalSize) });
   }
   console.log("DONE!\n");

   // const metadata_path = "public\\compiled";
   // const metadata_profile = {};
   // const metadata_options = {};
   // const metadata_override = true;

   // const compiled_metadata = await compileMetadata(metadata_path, metadata_profile, metadata_options, metadata_override);
   // compiled_metadata && console.log("count:", compiled_metadata.length);
}

async function compileItems(path, profile, options, target_dir, width, height, override) {
   const profileActions = [
      {
         profile: { properties: { extension: ".mp4" } },
         action: {
            kind: "copy",
            override,
            get_target_path: (item) => PATH.join(target_dir, "videos", item.crawl_relative_path),
         },
      },
      {
         profile: { properties: { extension: ".png" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(target_dir, "images", item.crawl_relative_dir, `${item.filename} ${width}x${height}.jpg`),
            get_ffmpeg_args: (item, target_path) => [
               '-y',
               "-i", item.path,
               "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase`,
               target_path
            ]
         }
      },
   ];

   profile = { isDir: false, ...profile };
   const items = await getItems(path, profile, options);

   // if (await ask("compile items? y/n: ") != "y")
   //    return

   const actionQueue = await getActionQueue(items, profileActions);

   // if (!actionQueue.length || await ask("run actions? y/n: ") != "y")
   //    return;

   return await Import(actionQueue);
}


async function compileMipmaps(path, profile, options, sizes, override) {
   const profileActions = [
      {
         profile: { properties: { extension: ".mp4" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(item.directory, "_meta", `${item.filename}.jpg`),
            get_ffmpeg_args: (item, target_path) => [
               '-y',
               "-i", item.path,
               "-vframes", "1",
               target_path
            ]
         }
      },

      ...sizes.map(({ width, height }) => ({
         profile: { properties: { extension: ".mp4" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(item.directory, "_meta", `${item.filename} ${width}x${height}.gif`),
            get_ffmpeg_args: (item, target_path) => [
               '-y',
               "-t", "60",
               "-i", item.path,
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
            get_target_path: (item) => PATH.join(item.directory, "_meta", `${item.filename} ${width}x${height}.jpg`),
            get_ffmpeg_args: (item, target_path) => [
               '-y',
               "-i", item.path,
               "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase`,
               target_path
            ]
         }
      })),

      ...sizes.map(({ width, height }) => ({
         profile: { properties: { extension: ".webp" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(item.directory, "_meta", `${item.filename} ${width}x${height}.webp`),
            get_ffmpeg_args: (item, target_path) => [
               '-y',
               "-i", item.path,
               "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase`,
               target_path
            ]
         }
      })),
   ]

   profile = { properties: { isDir: false }, ...profile };
   options = { ignore: ["\\_meta\\"], ...options }
   const items = await getItems(path, profile, options);

   // if (await ask("compile mipmaps? y/n: ") != "y")
   //    return

   const actionQueue = await getActionQueue(items, profileActions);

   // if (!actionQueue.length || await ask("run actions? y/n: ") != "y")
   //    return;

   return await Import(actionQueue);
}

async function compileMetadata(path, profile, options, override) {
   const profileActions = [
      {
         profile: { properties: { extension: ".jpg" } },
         action: {
            kind: "metadata",
            override,
            get_source_path: (item) => item.path,
            get_target_path: (item) => PATH.join(item.directory, "_meta", `${item.filename}.json`),
         }
      },
      {
         profile: { properties: { extension: ".gif" } },
         action: {
            kind: "metadata",
            override,
            get_source_path: (item) => PATH.join(item.directory, "_meta", `${item.filename}.jpg`),
            get_target_path: (item) => PATH.join(item.directory, "_meta", `${item.filename}.json`),
         }
      },
   ]

   profile = { properties: { isDir: false }, ...profile }
   options = { ignore: ["\\_meta\\"], ...options }
   const items = await getItems(path, profile, options);

   // if (await ask("compile metadata? y/n: ") != "y")
   //    return

   const actionQueue = await getActionQueue(items, profileActions);

   // if (!actionQueue.length || await ask("run actions? y/n: ") != "y")
   //    return;

   return await Import(actionQueue);
}

async function needsCompiling(item, action, target_path) {
   const { override } = action;
   const { metadata: { mtime, size } } = item;

   let target_metadata =
      await exists(target_path) &&
      await fs.promises.lstat(target_path);

   const needsCompiling = override
      || !target_metadata
      || target_metadata.size == 0
      || target_metadata.mtime < mtime;

   if (!needsCompiling)
      return false;

   //console.log(`${formatBytes(size)} - ${item.filename_with_extension}`)
   //console.log(`   > ${target_metadata ? formatBytes(target_metadata.size) : "X"} - ${PATH.basename(target_path)}`)
   return true;
}

async function getItems(path, profile, options) {
   const items = await Crawl(path, profile, options);
   // items.sort((i1, i2) => i1.metadata.size - i2.metadata.size);

   //items.forEach(i => console.log(`${formatBytes(i.metadata.size)} - ${i.filename_with_extension}`));
   const totalSize = items.reduce((tot, i) => tot + i.metadata.size, 0);
   console.log({ items: items.length, size: formatBytes(totalSize) });

   return items;
}

async function getActionQueue(items, profileActions) {
   const actionQueue = [];

   for (const item of items) {

      const actions = profileActions
         .filter(a => checkProfile(item, a.profile))
         .map(({ action }) => action);

      for (const action of actions) {

         const { get_target_path } = action;
         const target_path = get_target_path(item);

         if (!await needsCompiling(item, action, target_path))
            continue;

         actionQueue.push({ item, target_path, action });
      }
   }

   if (actionQueue.length == 0) {
      console.log("no actions!");
      return [];
   }

   const totalSize = actionQueue.reduce((tot, { item }) => tot + item.metadata.size, 0);
   console.log({ actions: actionQueue.length, size: formatBytes(totalSize) });
   return actionQueue;
}