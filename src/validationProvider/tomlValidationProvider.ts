import { JSONObjectValidator } from "../objectValidator/JSONObjectValidator";
import { IObjectValidator } from "../objectValidator/objectValidator";
import { IParser } from "../Parser/parser";
import { TomlParser } from "../Parser/tomlParser";
import { FileReader } from "../Reader/fileReader";
import { IReader } from "../Reader/reader";
import { IValidationProvider } from "./validationProvider";

export class TomlValidationProvider implements IValidationProvider {
    validate(path: string): [Boolean, string[] | null] {
        try
        {
            let reader: IReader = new FileReader();
            let contentText = reader.readText(path);
            let parser: IParser = new TomlParser();
            let contentObject = parser.parseObject(contentText);
            let validator: IObjectValidator = new JSONObjectValidator();
            return validator.validateObject(contentObject);
        }
        catch (e) 
        {
            return [false, ["error reading the toml file please verify the toml structure!"]];
        }
    }
}