/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { EnarxCliAdapter } from '../enarxCliAdapter/enarxCliAdapter';
import { TomlValidationProvider } from '../validationProvider/tomlValidationProvider';
import { IValidationProvider } from '../validationProvider/validationProvider';
export default function runWasmOnEnarxFactory() {
    return vscode.commands.registerCommand('vscode-enarx.runWasmOnEnarx', async () => {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Open',
            filters: {
                'WASM Files': ['wasm']
            }
        };
        let out = await vscode.window.showOpenDialog(options);
        if (out && vscode.workspace.workspaceFolders) {
            let wasmPath = out[0].fsPath;
            let toml = `${vscode.workspace.workspaceFolders[0].uri.path}/Enarx.toml`;
            let validationProvider: IValidationProvider = new TomlValidationProvider();
            let result = validationProvider.validate(toml);
            if (result[0] && result[1] === null) {
                let enarx = new EnarxCliAdapter();
                enarx.runWasm(wasmPath, toml);
            } else {
                result[1]?.forEach(err => {
                    vscode.window.showErrorMessage(`Enarx.toml Validation error: ${err}`);
                });
            }   
        }
    });
}