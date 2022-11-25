import fs from 'fs';
import PATH from 'path';

import Crawl, { checkProfile } from "./crawl.js";
import Import from "./import.js";
import { ask, formatBytes, exists, ensureDir } from "./utils.js";

import sizeOf from 'image-size';
import { promisify } from 'util'
sizeOf.setConcurrency(123456);
const sizeOfPromise = promisify(sizeOf);


await Copy();
console.log("COPYING DONE!")

async function Copy() {
   const item_settings = [
      {
         path: "C:\\websites\\open-source-god-complex\\public\\compiled",
         profile: { properties: { extension: ".mp4" } },
         options: {
            ignore: [
               "\\_meta\\",
            ]
         },
         // target_dir: "C:\\Users\\Maxim\\Desktop\\visuals auto",
         target_dir: "D:\\",
         override: false
      },
   ]

   for (const settings of item_settings) {
      const { path, profile, options, target_dir, override } = settings;

      const compiled_items = await compileItems(path, profile, options, target_dir, override);
      if (compiled_items) {
         const succeeded_items = compiled_items.filter(item => !item.error);
         const failed_items = compiled_items.filter(item => item.error);
         console.log("failed:", { items: failed_items.length });

         const totalSize = succeeded_items.reduce((tot, i) => tot + i.metadata.size, 0);
         console.log("succeeded:", { items: succeeded_items.length, size: formatBytes(totalSize) });
      }
      console.log("DONE!\n");
   };
}

async function compileItems(path, profile, options, target_dir, override) {
   console.log("compileItems", { path, profile, options, target_dir, override });

   const profileActions = [
      {
         profile: { properties: { extension: ".mp4" } },
         action: {
            kind: "copy",
            get_target_path: (item) => PATH.join(target_dir, item.filename_with_extension),
            override,
         }
      },
   ];

   if (await ask("compile items? y/n: ") != "y")
      return

   const items = await getItems(path, profile, options);

   if (!items)
      return

   const actionQueue = await getActionQueue(items, profileActions);

   if (!actionQueue.length || await ask("run actions? y/n: ") != "y")
      return;

   return await Import(actionQueue);
}

function pathToFilename(path) {
   return path
      .replaceAll(":", "__COL__")
      .replaceAll("\\", "__BS__")
      .replaceAll("/", "__FS__")
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

   console.log(`${formatBytes(size)} - ${item.path}`)
   console.log(`   > ${target_metadata ? formatBytes(target_metadata.size) : "X"} - ${target_path}`)
   return true;
}

async function getItems(path, profile, options) {
   console.log("getItems", { path, profile, options });
   if (await ask("crawl? y/n: ") != "y")
      return

   const items = await Crawl(path, profile, options);
   // items.sort((i1, i2) => i1.metadata.size - i2.metadata.size);

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