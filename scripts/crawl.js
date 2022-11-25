import fs from 'fs';
import PATH from 'path';

import { UUID } from "./utils.js";

const LOG = false;

function shouldIgnore(path, ignore) {
   return ignore.some(ignore => path.includes(ignore));
}

export async function generateItem(path) {
   try {
      const metadata = await fs.promises.lstat(path);
      const isDir = metadata.isDirectory();

      let id = UUID();

      const item = {
         id,
         isDir,
         metadata,
         path,
      };

      if (!isDir) {
         const extension = PATH.extname(path);
         const directory = PATH.dirname(path);
         const filename = PATH.basename(path, extension);
         const filename_with_extension = PATH.basename(path);

         Object.assign(item, {
            directory,
            filename,
            extension,
            filename_with_extension,
         });
      }

      return item;

   } catch (err) {
      console.error("error!", path, "\n>", err, "\n");
      return { path, error: err }
   }

}

export function checkProfile(item, profile) {
   const {
      properties = {},
      matches = {},
      test = () => true
   } = profile;

   for (const [key, value] of Object.entries(properties)) {
      if (item[key] != value)
         return false;
   }
   for (const [key, value] of Object.entries(matches)) {
      if (!item[key]?.includes(value))
         return false;
   }
   return test(item);
}

function shouldCrawl(depth) {
   return depth != 0
}


async function Crawl(crawlPath, profile = {}, options = {}) {
   const {
      depth = -1,
      ignore = []
   } = options;

   const items = [];

   await _crawl(crawlPath, depth);

   return items;

   async function _crawl(path, depth) {
      // LOG && console.log(">> crawl:", path);

      // try {

      if (shouldIgnore(path, ignore))
         return;

      // LOG && console.log(">> crawl:", path);

      const item = await generateItem(path);
      const crawl_relative_path = path.replace(crawlPath, "");
      const crawl_relative_dir = PATH.dirname(crawl_relative_path);
      Object.assign(item, {
         crawl_relative_path,
         crawl_relative_dir
      });

      const { isDir } = item;

      if (checkProfile(item, profile)) {
         LOG && console.log(">> crawl add:", path);
         items.push(item);
      }

      if (isDir && shouldCrawl(depth)) {

         const files = await fs.promises.readdir(path, { encoding: 'utf8', withFileTypes: true });

         for (const file of files) {
            const { name } = file;

            let newPath = PATH.join(path, name);

            if (file.isSymbolicLink() && file.isDirectory()) {
               const link = await fs.promises.readlink(newPath);
               newPath = await fs.promises.realpath(link);
            }

            await _crawl(newPath, depth - 1);
         };
      }

      // } catch (error) {
      //    console.error("ERROR:",
      //       "\path", path,
      //       error,
      //       "\n",
      //    );
      // }
   }
}


async function test() {
   const path = "C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\rendr"
   // const path = "public\\compiled"

   const profile = {
      // properties: { extension: ".mp4" },
      // test: (item) => item.metadata.size < 10000000
      // matches: { filename: "50x50." }
   };

   const options = {
      depth: 2,
   }

   const data = await Crawl(path, profile, options);

   console.log(data, "\n");
   console.log("len:", data.length, "\n");
}

// test();

export default Crawl;