import fs from 'fs';
import PATH from 'path';

import Crawl, { checkProfile } from "./crawl.js";
import Import from "./import.js";
import { ask, formatBytes, exists, ensureDir } from "./utils.js";


await Mipmap();
console.log("MIPMAPPING DONE!")

async function Mipmap() {
   const mipmap_path = "public\\archive";
   const mipmap_profile = {};
   const mipmap_options = {};
   const mipmap_sizes = [
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
   const mipmap_override = false;
   const mipmap_ask = { run: false, compile: false };
   const mipmap_log = { each: false, summary: true };

   const compiled_mipmaps = await compileMipmaps(mipmap_path, mipmap_profile, mipmap_options, mipmap_sizes, mipmap_override, mipmap_ask, mipmap_log);

   if ((mipmap_log || mipmap_log?.summary)
      && compiled_mipmaps) {
      const succeeded_items = compiled_mipmaps.filter(item => !item.error);
      const failed_items = compiled_mipmaps.filter(item => item.error);
      console.log("failed:", { items: failed_items.length });

      const totalSize = succeeded_items.reduce((tot, i) => tot + i.metadata.size, 0);
      console.log("succeeded:", { items: succeeded_items.length, size: formatBytes(totalSize) });
   }
}

async function compileMipmaps(path, profile, options, sizes, override, should_ask, should_log) {
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
   const items = await getItems(path, profile, options, should_log);

   if ((should_ask === true || should_ask?.compile === true)
      && await ask("compile mipmaps? y/n: ") != "y")
      return

   const actionQueue = await getActionQueue(items, profileActions, should_log);

   if (!actionQueue.length) {
      console.log("no actions!");
      return;
   }

   if ((should_ask === true || should_ask?.run === true)
      && await ask("run actions? y/n: ") != "y")
      return;

   return await Import(actionQueue);
}

async function getItems(path, profile, options, should_log) {
   console.log("getting items...");
   const items = await Crawl(path, profile, options);
   // items.sort((i1, i2) => i1.metadata.size - i2.metadata.size);

   if (should_log === true || should_log?.each)
      items.forEach(i => console.log(`${formatBytes(i.metadata.size)} - ${i.filename_with_extension}`));

   if (should_log === true || should_log?.summary) {
      const totalSize = items.reduce((tot, i) => tot + i.metadata.size, 0);
      console.log({ items: items.length, size: formatBytes(totalSize) });
   }

   return items;
}

async function getActionQueue(items, profileActions, should_log) {
   console.log("getting action queue...");
   const actionQueue = [];

   for (const item of items) {

      const actions = profileActions
         .filter(a => checkProfile(item, a.profile))
         .map(({ action }) => action);

      for (const action of actions) {

         const { get_target_path } = action;
         const target_path = get_target_path(item);

         if (!await needsCompiling(item, action, target_path, should_log))
            continue;

         actionQueue.push({ item, target_path, action });
      }
   }

   if (should_log === true || should_log?.summary) {
      const totalSize = actionQueue.reduce((tot, { item }) => tot + item.metadata.size, 0);
      console.log({ actions: actionQueue.length, size: formatBytes(totalSize) });
   }
   return actionQueue;
}


async function needsCompiling(item, action, target_path, should_log) {
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

   if (should_log === true || should_log?.each === true) {
      console.log(`${formatBytes(size)} - ${item.filename_with_extension}`)
      console.log(`   > ${target_metadata ? formatBytes(target_metadata.size) : "X"} - ${PATH.basename(target_path)}`)
   }
   return true;
}