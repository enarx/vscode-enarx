import * as vscode from 'vscode';
import { IValidationProvider } from '../validationProvider/validationProvider';
import { TomlValidationProvider } from '../validationProvider/tomlValidationProvider';

export default function enarxTomlValidationCmdFactory() {
    return vscode.commands.registerCommand('vscode-enarx.enarxTomlValidation', () => {
        if (vscode.workspace.workspaceFolders) {
            let workspacePath = vscode.workspace.workspaceFolders[0].uri.path;
            let exarxTomlPath = `${workspacePath}/Enarx.toml`;
            let validationProvider: IValidationProvider = new TomlValidationProvider();
            let result = validationProvider.validate(exarxTomlPath);
            if (result[0] && result[1] === null) {
                vscode.window.showInformationMessage(`Enarx.toml is correct!`);
            } else {
                result[1]?.forEach(err => {
                    vscode.window.showErrorMessage(`Enarx.toml Validation error: ${err}`);
                });
            }
        }
    });
}