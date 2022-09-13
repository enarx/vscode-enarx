import { IReader } from "./reader";
import * as fs from 'fs';


export class FileReader implements IReader {
    public readText(path: string): string {
        if (fs.existsSync(path)) {
            let content = fs.readFileSync(path, 'utf-8')!;
            return content;
        } else {
            throw new Error(`error: path ${path} doesn't exist`)
        }
    }
}