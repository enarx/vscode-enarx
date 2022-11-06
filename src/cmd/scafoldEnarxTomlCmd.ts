import * as vscode from 'vscode';
import * as fs from 'fs';
import { ENARX_TOML_EXAMPLE } from '../enarxTomlExample';

export default function scafoldEnarxTomlCmdFactory(): vscode.Disposable {
    return vscode.commands.registerCommand('vscode-enarx.scafoldEnarxToml', () => {
        if (vscode.workspace.workspaceFolders) {
            try {
                fs.writeFileSync(`${vscode.workspace.workspaceFolders[0].uri.fsPath}/Enarx.toml`, ENARX_TOML_EXAMPLE);
            } catch (_: any) {
                vscode.window.showErrorMessage("We couldn't create an Enarx.toml file at the workspace location", "Ok");
            }
        } else {
            vscode.window.showErrorMessage('We couldn\'t create a Enarx.toml since you are working outside any workspace.');
        }
    });
}