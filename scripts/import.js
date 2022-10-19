import PATH from 'path';
import fs from 'fs';

import Crawl, { checkProfile, generateItem } from "./crawl.js";
import ffmpeg from "./ffmpeg.js";
import RunQueue from "./actionQueue.js";
import { formatBytes, ensureDir, exists } from "./utils.js";

const LOG = true;

async function hasBeenModifiedSinceImport(item, target_path) {
   const { metadata: { mtime } } = item;
   const target_mtime = (await fs.promises.lstat(target_path)).mtime;
   if (target_mtime >= mtime) {
      LOG && console.log("source has not been modified since import", "\n",
         "\t", "source mtime:", mtime, "\n",
         "\t", "target mtime:", target_mtime, "\n",
      );
      return false;
   }
   return true;
}

async function copyItem(item, target_path) {
   // const { filename_with_extension, path } = item;
   const filename_with_extension = PATH.basename(target_path);
   LOG && console.log(">> copy", filename_with_extension);
   await fs.promises.copyFile(path, target_path);
   LOG && console.log("<< copy", filename_with_extension,);
}

async function ffmpegItem(item, target_path, args) {
   // const { filename_with_extension } = item;
   const filename_with_extension = PATH.basename(target_path);
   LOG && console.log(">> ffmpeg", filename_with_extension);
   await ffmpeg(args);
   LOG && console.log("<< ffmpeg", filename_with_extension);
}


async function executeAction(item, target_path, action) {
   const { kind, override } = action;

   if (!await exists(target_path))
      await ensureDir(target_path)
   else if (!override && !await hasBeenModifiedSinceImport(item, target_path))
      return false;

   switch (kind) {
      case "copy":
         await copyItem(item, target_path);
         return true;
      case "ffmpeg":
         const { path } = item;
         const { get_ffmpeg_args } = action;
         const args = get_ffmpeg_args(path, target_path);
         await ffmpegItem(item, target_path, args);
         return true;
   }
   return false;
}


export default async function Import(items, profileActions) {
   const actionQueue = [];

   for (const item of items) {

      const actions = profileActions
         .filter(a => checkProfile(item, a.profile))
         .map(({ action }) => action);

      for (const action of actions) {

         const { get_target_path } = action;
         const target_path = get_target_path(item);

         actionQueue.push({ item, target_path, action });
      }
   }

   const imported_items = [];

   await RunQueue(actionQueue,
      async ({ item, target_path, action }, index, count) => {
         LOG && console.log(">> action", "(", index, "/", count, ")");
         return await executeAction(item, target_path, action)
      },
      async (success, { item, target_path }, index, count) => {
         if (!success) {
            LOG && console.log("<< action", "(", index, "/", count, ")", "\n");
            return;
         }

         const imported_item = await generateItem(target_path);
         imported_items.push(imported_item);

         LOG && console.log("<< action", "(", index, "/", count, ")",
            "\n\tfrom:", item.path,
            "\n\tsize:", formatBytes(item.metadata.size),
            "\n\tto:  ", imported_item.path,
            "\n\tsize:", formatBytes(imported_item.metadata.size),
            "\n"
         );
      },
   );

   return imported_items;
}