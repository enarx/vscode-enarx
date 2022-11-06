import { DrawbridgeAdapter } from "../DrawbridgeAdapter/drawbridgeAdapter";
import * as vscode from 'vscode';

export default function drawbridgeLoginCmdFactory(drawbridgeAdapter: DrawbridgeAdapter) {
    return vscode.commands.registerCommand('vscode-enarx.drawbridgeLogin',async () => {
        await drawbridgeAdapter.login();
    });
}