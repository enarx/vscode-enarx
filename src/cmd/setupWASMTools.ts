import * as vscode from 'vscode';
import { setupWasmToolsProvider } from '../setupWasmProvider';

export default function setupWasmToolsCmdFactory() {
    return vscode.commands.registerCommand('vscode-enarx.setupWasmTools',async () => {
        setupWasmToolsProvider();
    });
}