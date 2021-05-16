import { ParsedSimfile } from "./parsed-simfile";
import { SimfileRegistryEntry } from "./simfile-registry-entry";

export interface SimfileRegistryFolder {
    title: string;
    location: string;
    simfiles: SimfileRegistryEntry[];
    parsedSimfiles: Map<string, ParsedSimfile>;
}
