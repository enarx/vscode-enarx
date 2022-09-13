export interface IValidationProvider {
    validate(path: string): [Boolean, null | string[]];
}