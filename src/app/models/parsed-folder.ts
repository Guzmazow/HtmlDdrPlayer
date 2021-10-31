import { ParsedSimfile } from "./parsed-simfile";
import { SimfileRegistryFolder } from "./simfile-registry-folder";

export class ParsedSimfileFolder {

  title: string;
  location: string;
  parsedSimfiles: Map<string, ParsedSimfile>;

  constructor(simfileRegistryFolder: SimfileRegistryFolder) {
    this.title = simfileRegistryFolder.title;
    this.location = simfileRegistryFolder.location;
    this.parsedSimfiles = new Map<string, ParsedSimfile>(simfileRegistryFolder.simfiles.map(x => [x.filename, new ParsedSimfile(this, x)]));
  }
}
