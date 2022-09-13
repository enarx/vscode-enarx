import ajv from "ajv";
import { ENARX_TOML_SCHEMA_DEFINITION } from "../EnarxTomlScema";
import { IObjectValidator } from "./objectValidator";
import {betterAjvErrors} from '@apideck/better-ajv-errors';
import {JSONSchema6} from 'json-schema';

export class JSONObjectValidator implements IObjectValidator {
    validateObject(obj: Object): [Boolean, any] {
        let objectVal = new ajv();
        let validator = objectVal.compile(ENARX_TOML_SCHEMA_DEFINITION);
        if (validator(obj))
        {
            return [true, null];
        } 
        else {
            console.log(validator.errors);
            const output = betterAjvErrors({schema: ENARX_TOML_SCHEMA_DEFINITION as JSONSchema6, data: obj, errors: validator.errors!});
            const messages = output.map(err => err.message);
            return [false, messages];
        }
    }
}