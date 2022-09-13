export interface IObjectValidator {
    validateObject(obj: Object): [Boolean, string[] | null];
}