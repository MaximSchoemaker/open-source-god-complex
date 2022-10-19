// const fs = require('fs');
// const PATH = require('path');
import fs from 'fs';
import PATH from 'path';
import { spawn } from "child_process";
import OS from 'os';
import OS_UTILS from 'os-utils';

let id_counter = 0;

const WIDTH = 512;
const HEIGHT = 512;

const CPU_TARGET = 0;
const RERUN_IMPORT_QUEUE_TIMEOUT = 100;

const MAX_COPY_SIZE = -1; //100000000;

const IGNORE = [
   "\\swarm\\session",
]

var CMD_PATH = 'C:/Program Files (x86)/ffmpeg/bin/ffmpeg.exe';

function CompileContent(rootDir, compileDir) {
   compile(rootDir);
   function compile(path) {
      // console.log(path);

      const lstat = fs.lstatSync(path);
      if (lstat.isDirectory()) {
         const files = fs.readdirSync(path, { encoding: 'utf8', withFileTypes: true });
         files.forEach(file => {
            const { name } = file;
            let subDir = PATH.join(path, name);
            try {

               // if (file.isSymbolicLink()) {
               //    const link = fs.readlinkSync(subDir);
               //    subDir = fs.realpathSync(link);
               //    CompileContent(subDir);
               // } else {
               //    compile(subDir);
               // }

               compile(subDir);
            } catch (error) {
               console.error("ERROR:",
                  "\nsubDir", subDir,
                  error,
                  "\n",
               );
            }
         });
         return;
      }

      const extension = PATH.extname(path);
      const filename = PATH.basename(path, extension);

      const { mtime, size, birthtime } = lstat;
      const fileData = {
         id: id_counter++,
         filename,
         path,
         extension,
         mtime,
         size,
         birthtime
         // lstate,
      }
      if (IGNORE.some(ignore => path.includes(IGNORE))) {
         // console.log("ignore:", path);
         return;
      }


      switch (extension) {
         case ".json":
            structures.push(fileData);
            break;
         case ".png":
         case ".jpg": {
            if (MAX_COPY_SIZE > 0 && size > MAX_COPY_SIZE) {
               console.log("too big:", filename + extension, "(", niceBytes(size), ")");
               return;
            }

            const src = PATH.join(
               PATH.dirname(path)
                  .replace(rootDir, PATH.join("compiled/images", compileDir))
               , `${filename} ${WIDTH}x${HEIGHT}${extension}`
            );

            const toPath = PATH.join("public/", src);
            let should_import = !fs.existsSync(toPath);
            if (!should_import) {
               const dateFrom = mtime;
               const lstatTo = fs.lstatSync(toPath);
               const dateTo = lstatTo.mtime;
               should_import =
                  dateFrom > dateTo
                  || lstatTo.size == 0
            }

            const get_ffmpeg_args = (inPath, outPath) => [
               '-y',
               "-i", inPath,
               "-vf", `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase`,
               outPath
            ];

            images.push({ ...fileData, toPath, src, should_import, get_ffmpeg_args });
         } break;
         case ".gif":
         case ".mp4": {
            if (MAX_COPY_SIZE > 0 && size > MAX_COPY_SIZE) {
               console.log("too big:", filename + extension, "(", niceBytes(size), ")");
               return;
            }

            const src = PATH.join(
               PATH.dirname(path)
                  .replace(rootDir, PATH.join("compiled/videos", compileDir))
               , `${filename} ${WIDTH}x${HEIGHT}.gif`
            );

            const toPath = PATH.join("public/", src);
            let should_import = !fs.existsSync(toPath);
            if (!should_import) {
               const dateFrom = mtime;
               const lstatTo = fs.lstatSync(toPath);
               const dateTo = lstatTo.mtime;
               should_import =
                  dateFrom > dateTo
                  || lstatTo.size == 0;
            }

            const get_ffmpeg_args = (inPath, outPath) => [
               '-y',
               "-t", "60",
               "-i", inPath,
               "-vf", `fps=50,scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
               outPath
            ]

            videos.push({ ...fileData, toPath, src, should_import, get_ffmpeg_args });
         } break;
      }
   }
}


function generateImports(contents, kind) {
   let importsLine, dataLine, exportLine;

   if (kind) {
      importsLine = contents.map((content, i) => {
         const { id, path } = content;
         return `import ${kind}_${id} from "../../${content.path.replaceAll("\\", "\/")}"`;
      }).join("\n");

      dataLine = `const data = [${contents.map((meta) => `{ ${kind}: ${kind}_${meta.id}, meta: ${JSON.stringify(meta)} }`).join(", ")}]`
   } else {
      dataLine = `const data = [${contents.map((meta) => JSON.stringify(meta)).join(", ")}]`
   }

   exportLine = "export default data";

   const file = [importsLine, dataLine, exportLine].join("\n");
   return file;
}


async function ffmpeg(args) {
   return new Promise((resolve, reject) => {

      var proc = spawn(CMD_PATH, args);

      // proc.stderr.setEncoding("utf8")
      proc.stdout.on('data', function (data) { });
      proc.on('close', resolve);
   });
}
const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
function niceBytes(x) {
   let l = 0, n = parseInt(x, 10) || 0;
   while (n >= 1024 && ++l) {
      n = n / 1024;
   }
   return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
}

async function cpuUsage() {
   return new Promise((resolve, reject) => {
      OS_UTILS.cpuUsage(resolve);
   });
}


const importsQueue = [];
function populateImportQueue(imports) {
   importsQueue.push(...imports.filter(i => i.should_import));
}

let running_max = 1;
let running = false;
function runImportQueue() {
   if (running || !importsQueue.some(i => i.should_import))
      return;

   running = true;
   setTimeout(async () => {
      running = false;

      const running_count = importsQueue.filter(i => i.importing).length;

      const cpu_usage = await cpuUsage();
      if (cpu_usage < CPU_TARGET)
         running_max++;
      if (cpu_usage >= CPU_TARGET)
         running_max = Math.max(1, running_max - 1);

      console.log({ running: running_count, max: running_max, cpu_usage, }, "\n");

      if (running_count < running_max) {
         runImportQueue();
         const content = importsQueue.find(i => i.should_import);
         if (content) await importContent(content);
         runImportQueue();
      }

   }, RERUN_IMPORT_QUEUE_TIMEOUT);
}

function ensureDir(path) {
   const dir = PATH.dirname(path);
   if (!fs.existsSync(dir)) {
      console.log(">> create dir:", dir);
      fs.mkdirSync(dir, { recursive: true });
   }
}

async function importContent(content) {
   content.importing = true;
   content.should_import = false;

   // setTimeout(runImportQueue, RERUN_IMPORT_QUEUE_TIMEOUT);

   const { path, toPath, get_ffmpeg_args } = content;
   const args = get_ffmpeg_args?.(path, toPath);

   ensureDir(toPath);

   const copyCount = importsQueue.reduce((tot, c) => tot + (!c.should_import ? 1 : 0), 0);
   console.log(">> copy", "(", copyCount, "/", importsQueue.length, ")",
      // content.path,
      "\n\tsize:", niceBytes(content.size),
      "\n\tfrom:", content.path,
      "\n\tto:  ", toPath,
      "\n"
   );

   if (!args)
      fs.copyFileSync(content.path, toPath);
   else
      await ffmpeg(args);

   content.importing = false;
   content.done = true;

   const lstat = fs.lstatSync(toPath);
   const doneCount = importsQueue.reduce((tot, c) => tot + (c.done ? 1 : 0), 0);
   console.log("<< done", "(", doneCount, "/", importsQueue.length, ")",
      "\n\tsize:", niceBytes(lstat.size),
      "\n\tto:  ", toPath,
      "\n"
   )
};

const structures = [];
const images = [];
const videos = [];
CompileContent("content");
CompileContent("C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\rendr", "rendr");
CompileContent("C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots", "screenshots");
CompileContent("C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\videos", "videos");

populateImportQueue(videos);
populateImportQueue(images);

const sorted_images = images.sort((v1, v2) => v2.mtime - v1.mtime);
const sorted_videos = videos.sort((v1, v2) => v2.mtime - v1.mtime);

const structuresImportsFile = generateImports(structures, "structure");
fs.writeFileSync("src/compiled/structuresImports.js", structuresImportsFile);

const imagesImportsFile = generateImports(sorted_images);
fs.writeFileSync("src/compiled/imagesImports.js", imagesImportsFile);


const videosImportsFile = generateImports(sorted_videos);
fs.writeFileSync("src/compiled/videosImports.js", videosImportsFile);

runImportQueue();

// await copyContents(videos, "public/compiled");
// await copyContents(images, "public/compiled");
