import { AbiCoder } from "@ethersproject/abi";
import fs from "fs";
import isEqual from "lodash/isEqual";
import path from "path";

import { allFacetNames } from "../config/constants";

let files: string[] = [];
function loopDirectory(directory: string) {
  fs.readdirSync(directory).forEach(file => {
    const absolute = path.join(directory, file);
    if (fs.statSync(absolute).isDirectory()) {
      return loopDirectory(absolute);
    } else {
      return files.push(absolute);
    }
  });
  return files;
}

function filterUnique(abi: AbiCoder[]) {
  const cleaned: AbiCoder[] = [];
  abi.forEach(function (itm) {
    var unique = true;
    cleaned.forEach(function (itm2) {
      if (isEqual(itm, itm2)) unique = false;
    });
    if (unique) cleaned.push(itm);
  });
  return cleaned;
}

export function generateABI() {
  const allFilePaths = loopDirectory("./artifacts/contracts");

  // cherry pick our facets
  const paths = allFilePaths.filter(file => {
    if (!file.endsWith(".json") || file.endsWith(".dbg.json")) return false;
    // extract fileName
    const fileName = file.split("\\").pop();
    if (!fileName) return false;
    return allFacetNames.includes(fileName.split(".")[0]);
  });

  let abi: AbiCoder[] = [];
  for (const path of paths) {
    const json: { abi: AbiCoder[] } = JSON.parse(fs.readFileSync(path).toString());
    abi.push(...json.abi);
  }

  // remove duplicate objects
  const filtered = filterUnique(abi);

  // stringify it
  let finalAbi = JSON.stringify(filtered);

  const outputDir = "./src/abi/diamond.json";
  fs.writeFileSync(outputDir, finalAbi);
  console.log(`ABI written to ${outputDir}`);
}

for (var i = 0; i < process.argv.length; i++) {
  switch (process.argv[i]) {
    case "generate":
      generateABI();
      break;
  }
}
