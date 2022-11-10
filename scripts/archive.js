import fs from 'fs';
import PATH from 'path';

import Crawl, { checkProfile } from "./crawl.js";
import Import from "./import.js";
import { ask, formatBytes, exists, ensureDir } from "./utils.js";

import sizeOf from 'image-size';
import { promisify } from 'util'
sizeOf.setConcurrency(123456);
const sizeOfPromise = promisify(sizeOf);


await Archive();
console.log("ARCHIVING DONE!")

async function Archive() {
   const item_settings = [
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\rendr",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics",
      //    profile: { properties: { extension: ".png" } },
      //    options: { ignore: ["\\swarm\\", "\\node_modules\\", "\\screenshots\\"] },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots\\swarm\\final",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots\\swarm\\seesion 1",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots\\swarm\\session 2",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots\\swarm\\session 3 (auto)",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots\\swarm\\session 4 (auto)",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots\\swarm\\session 5 (sacred geom)",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots\\swarm\\session 6",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots\\swarm\\session 7",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots\\swarm\\session 8",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots\\swarm\\setups",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots\\swarm\\yes",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\Processing Projects",
      //    profile: { properties: { extension: ".png" } },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive",
      //    width: 1080, height: 1080, override: false
      // },
      // {
      //    path: "C:\\Users\\Maxim\\Dropbox\\",
      //    profile: { properties: { extension: ".png" } },
      //    options: {
      //       ignore: [
      //          "\\My Own Stuff\\rendr\\",
      //          "\\My Own Stuff\\JS Projects\\graphics\\",
      //          "\\My Own Stuff\\archive\\",
      //          "\\My Own Stuff\\print\\",
      //          "\\My Own Stuff\\Processing Projects\\"
      //       ]
      //    },
      //    target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive who dis",
      //    width: 1080, height: 1080, override: false
      // },
      {
         path: "C:\\",
         profile: { properties: { extension: ".png" } },
         options: {
            ignore: [
               "\\Dropbox\\",
               "\\open-source-god-complex\\",
            ]
         },
         target_dir: "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\archive who dat",
         width: 1080, height: 1080, override: false
      },
   ]

   for (const settings of item_settings) {
      const { path, profile, options, target_dir, width, height, override } = settings;

      const compiled_items = await compileItems(path, profile, options, target_dir, width, height, override);
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

async function compileItems(path, profile, options, target_dir, width, height, override) {
   console.log("compileItems", { path, profile, options, target_dir, width, height, override });

   const profileActions = [
      {
         profile: { properties: { extension: ".png" } },
         action: {
            kind: "ffmpeg",
            override,
            get_target_path: (item) => PATH.join(target_dir, item.metadata.type, `${item.metadata.width}x${item.metadata.height}`, `${pathToFilename(item.path)} .webp`),
            get_ffmpeg_args: (item, target_path) => [
               '-y',
               "-i", item.path,
               "-vf", `scale='min(iw,${width})':'min(ih,${height})':force_original_aspect_ratio=increase`,
               target_path
            ]
         }
      },
   ];

   // if (await ask("compile items? y/n: ") != "y")
   //    return

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

   // console.log(`${formatBytes(size)} - ${item.path}`)
   // console.log(`   > ${target_metadata ? formatBytes(target_metadata.size) : "X"} - ${target_path}`)
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

   if (await ask("get item dimensions? y/n: ") != "y")
      return

   const dimension_items = (await Promise.allSettled(items.map(async item => {
      try {
         const metadata = await sizeOfPromise(item.path)
         console.log(metadata, item.path);
         Object.assign(item.metadata, metadata);
         return item;
      } catch (e) {
         console.error("error!", item.path, "\n>", e, "\n");
         throw e;
      }
   })))
      .filter(settled_promise => {
         // if (settled_promise.status != "fulfilled")
         //    console.error(settled_promise.status, "!", settled_promise.reason, "\n");
         return settled_promise.status == "fulfilled"
      })
      .map(fulfilled_promise => fulfilled_promise.value);

   //items.forEach(i => console.log(`${formatBytes(i.metadata.size)} - ${i.filename_with_extension}`));

   return dimension_items;
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