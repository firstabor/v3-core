import { AbiCoder } from "@ethersproject/abi";
import fs from "fs";
import isEqual from "lodash/isEqual";
import path from "path";

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
  const directoryFacets = "./artifacts/contracts/facets";
  const directoryLibraries = "./artifacts/contracts/libraries";
  const facetFiles = loopDirectory(directoryFacets);
  const directoryFiles = loopDirectory(directoryLibraries);
  const filePaths = [...facetFiles, ...directoryFiles];

  // filePaths can contain anything -> pick .json files and ignore .dbg.json files
  const paths = filePaths.filter(file => file.endsWith(".json") && !file.endsWith(".dbg.json"));

  let abi: AbiCoder[] = [];
  for (const path of paths) {
    const json: { abi: AbiCoder[] } = JSON.parse(fs.readFileSync(path).toString());
    abi.push(...json.abi);
  }

  // remove duplicate objects
  const filtered = filterUnique(abi);

  // stringify it
  let finalAbi = JSON.stringify(filtered);

  fs.writeFileSync("./tasks/data/diamond.json", finalAbi);
  console.log("ABI written to tasks/data/diamond.json");
}
