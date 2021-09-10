import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { inlineSource } from "inline-source";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(scriptDir, "../html/index.html");
const rootpath = join(scriptDir, "../");

inlineSource(htmlPath, {
  compress: false,
  rootpath,
}).then((inlinedHtml) => {
  writeFileSync(join(rootpath, "/build/index.html"), inlinedHtml);
});
