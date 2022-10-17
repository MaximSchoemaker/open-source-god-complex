// const fs = require('fs');
// const PATH = require('path');
import fs from 'fs';
import PATH from 'path';
import { spawn } from "child_process";

let id_counter = 0;

const WIDTH = 100;
const HEIGHT = 100;

function CompileContent(rootPath) {
   compile(rootPath);
   function compile(path) {
      // console.log(path);

      const lstat = fs.lstatSync(path);
      if (lstat.isDirectory()) {
         const files = fs.readdirSync(path, { encoding: 'utf8', withFileTypes: true });
         files.forEach(file => {
            const { name } = file;
            let subDir = PATH.join(path, name);
            try {

               if (file.isSymbolicLink()) {
                  const link = fs.readlinkSync(subDir);
                  subDir = fs.realpathSync(link);
                  CompileContent(subDir);
               } else {
                  compile(subDir);
               }
            } catch (error) {
               console.error("ERROR:", subDir);
            }
         });
         return;
      }

      const extension = PATH.extname(path);
      const filename = PATH.basename(path, extension);

      const { mtime } = lstat;
      const fileData = {
         id: id_counter++,
         filename,
         path,
         extension,
         mtime,
         // lstate,
      }
      switch (extension) {
         case ".json":
            structures.push(fileData);
            break;
         case ".png":
         case ".jpg":
            const srcPath = PATH.dirname(path)
               .replace(rootPath, "compiled");
            // .replace("content\\\\", "compiled")
            // .replace("C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\rendr", "compiled");
            const src = PATH.join(srcPath, `${filename} ${WIDTH}x${HEIGHT}${extension}`);
            images.push({ ...fileData, src });
            break;
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

// var spawn = require('child_process').spawn;
var cmd = 'C:/Program Files (x86)/ffmpeg/bin/ffmpeg.exe';

function copyContents(contents, toDir) {
   contents.forEach((content, i) => {
      const toPath = PATH.join("public", content.src);
      const toDir = PATH.dirname(toPath);
      if (!fs.existsSync(toDir)) {
         console.log(">>create dir:", toDir, "\n");
         fs.mkdirSync(toDir, { recursive: true });
      }

      let copy = !fs.existsSync(toPath);
      if (!copy) {
         const dateFrom = new Date(content.mtime);
         const dateTo = new Date(fs.lstatSync(toPath).mtime);
         copy = dateFrom > dateTo;
      }

      if (copy) {
         console.log(">>copy file", "(", i, "/", contents.length, ")", "\nfrom:", content.path, "\nto:", toPath, "\n");
         // fs.copyFileSync(content.path, toPath);

         var args = [
            // '-y',
            '-i', content.path,
            // '-s', `${WIDTH}x${HEIGHT}`,
            // "-vf", `scale=-1:${HEIGHT}`,
            "-vf", `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase`,
            // "-vf", `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2`,
            toPath
         ];

         var proc = spawn(cmd, args);

         proc.stdout.on('data', function (data) {
            // console.log(data);
         });

         proc.stderr.setEncoding("utf8")
         proc.stderr.on('data', function (data) {
            // console.log(data);
         });

         proc.on('close', function () {
            // console.log('finished');
         });

      }
   });
}

const structures = [];
const images = [];
CompileContent("content");
CompileContent("C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\rendr");
CompileContent("C:\\Users\\Maxim\\Dropbox\\My Own Stuff\\JS Projects\\graphics\\screenshots");

const structuresImportsFile = generateImports(structures, "structure");
fs.writeFileSync("src/compiled/structuresImports.js", structuresImportsFile);

const imagesImportsFile = generateImports(images);
fs.writeFileSync("src/compiled/imagesImports.js", imagesImportsFile);

copyContents(images, "public/compiled/");
