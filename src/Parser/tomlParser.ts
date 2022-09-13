import { IParser } from "./parser";
import * as toml from 'toml';
export class TomlParser implements IParser {
    parseObject(content: string): Object {
        return toml.parse(content);
    }
}