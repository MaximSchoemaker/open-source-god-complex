import PATH from 'path';
import fs from 'fs';

import Crawl, { checkProfile, generateItem } from "./crawl.js";
import ffmpeg from "./ffmpeg.js";
import metadata from "./metadata.js";
import RunQueue from "./actionQueue.js";
import { formatBytes, ensureDir, exists, ask } from "./utils.js";

const LOG = true;

async function copyItem(source_path, target_path) {
   const source_filename_with_extension = PATH.basename(source_path);
   const target_filename_with_extension = PATH.basename(target_path);
   LOG && console.log(">> copy:", target_filename_with_extension);
   await fs.promises.copyFile(source_path, target_path);
   LOG && console.log("<< copy:", target_filename_with_extension,);
}

async function ffmpegItem(source_path, target_path, args) {
   const source_filename_with_extension = PATH.basename(source_path);
   const target_filename_with_extension = PATH.basename(target_path);
   LOG && console.log(">> ffmpeg", args.join(" "));
   try {
      await ffmpeg(args);
   } catch {
      return false;
   }
   LOG && console.log("<< ffmpeg:", source_filename_with_extension, "->", target_filename_with_extension);
   return true;
}

async function metadataItem(source_path, target_path) {
   const source_filename_with_extension = PATH.basename(source_path);
   const target_filename_with_extension = PATH.basename(target_path);
   LOG && console.log(">> metadata:", source_filename_with_extension, "->", target_filename_with_extension);
   await metadata(source_path, target_path);
   LOG && console.log("<< metadata:", source_filename_with_extension, "->", target_filename_with_extension);
}

async function executeAction(item, target_path, action) {
   const { kind } = action;

   await ensureDir(target_path);

   try {
      switch (kind) {
         case "copy":
            await copyItem(item.path, target_path);
            return true;
         case "ffmpeg":
            const { get_ffmpeg_args } = action;
            const args = get_ffmpeg_args(item, target_path);
            return await ffmpegItem(item.path, target_path, args);
         case "metadata":
            const { get_source_path } = action;
            const source_path = get_source_path(item);
            await metadataItem(source_path, target_path);
            return true;
      }
   } catch (e) {
      console.error("error!", item.path, ">", target_path, "\n", ">", e);
   }
   return false;
}


export default async function Import(actionQueue) {
   const imported_items = [];

   await RunQueue(actionQueue,
      async ({ item, target_path, action }, index, count) => {
         LOG && console.log(">> action", "(", index, "/", count, ")");
         return await executeAction(item, target_path, action)
      },
      async (success, { item, target_path }, index, count) => {
         if (!success) {
            LOG && console.log("!! action failed", "(", index, "/", count, ")", "\n");
            imported_items.push({ error: "action failed" });
            return;
         }

         const imported_item = await generateItem(target_path);
         imported_items.push(imported_item);

         if (imported_item.error) {
            LOG && console.log("!! generateItem failed", "(", index, "/", count, ")", "\n");
            return
         }

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