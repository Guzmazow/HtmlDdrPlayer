import { SimfileRegistryEntry } from "./simfile-registry-entry";

export interface SimfileRegistryFolder {
    name: string;
    simfiles: SimfileRegistryEntry[];
}
