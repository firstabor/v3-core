import { AbiCoder } from "@ethersproject/abi";
import fs from "fs";
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

  let finalAbi = JSON.stringify(abi);
  fs.writeFileSync("./tasks/data/diamond.json", finalAbi);
  console.log("ABI written to tasks/data/diamond.json");
}
