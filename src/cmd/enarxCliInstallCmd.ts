import * as vscode from 'vscode';
import { EnarxCliAdapter } from '../enarxCliAdapter/enarxCliAdapter';

export default function enarxCliInstallCmdFactory(enarxCliAdapter: EnarxCliAdapter) {
    return vscode.commands.registerCommand('vscode-enarx.enarxCliInstall',async () => {
        await enarxCliAdapter.installEnarxProceedure();
    });
}