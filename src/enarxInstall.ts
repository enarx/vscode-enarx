import * as vscode from 'vscode';
import { exec } from './exec';

export function urlProvider(arch: string): string {
    if (arch === 'arm64') {
        return 'https://github.com/enarx/enarx/releases/download/v0.6.4/enarx-x86_64-unknown-linux-musl';
    } else if (arch === 'x64') {
        return 'https://github.com/enarx/enarx/releases/download/v0.6.4/enarx-aarch64-unknown-linux-musl';
    }
    throw new Error("error: unsupported platform");
}

export async function installEnarxProceedure(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    try {
        let { stdout } = await exec('enarx platform info -j', {}, channel);
        let outputJSON = JSON.parse(stdout);
        console.log(outputJSON);
    } catch (exception: any) {
        console.log(exception);
        if (exception instanceof SyntaxError) {
            vscode.window.showInformationMessage('enarx cli is not working as expected, please open an issue with a screenshot of command output: enarx platform info -j', 'Open an issue', 'Disregard')
                .then(selection => {
                    if (selection === 'Open an issue') {
                        vscode.env.openExternal(vscode.Uri.parse('https://github.com/enarx/vscode-enarx/issues'));
                    }
                });
        }
        if (exception?.hasOwnProperty('error') && exception?.error.hasOwnProperty('code') && isFinite(exception?.error.code) && exception?.error.code === 127) {
            let selection = await vscode.window.showErrorMessage('Enarx is not fount to be intalled, do you want to automatically install enarx?', 'Yes', 'Install Manually', 'Remind me later');
            if (selection !== null && selection === 'Yes') {
                console.log(process.platform);
                if (process.platform === 'darwin') {
                    vscode.window.showInformationMessage('Starting to install enarx on your local machine');
                    try {
                        await exec('brew install enarx/enarx/enarx', {}, channel);
                        vscode.window.showInformationMessage('Enarx was installed successfully!');
                    } catch (e: any) {
                        let err = e.error;
                        let message: string = "Oops! an unexpected error occured, you'll have to install enarx manually.";
                        if (err?.hasOwnProperty('code') && isFinite(err?.code) && err?.code === 127) {
                            message = 'Brew is not installed! You need to install enarx manually.';
                        }
                        let selection = await vscode.window.showErrorMessage(message, 'Install Manually', 'Do it later');
                        if (selection !== null && selection === 'Install Manually') {
                            vscode.env.openExternal(vscode.Uri.parse(`https://enarx.dev/docs/Quickstart`));
                        }
                    }
                } else if (process.platform === 'linux') {
                    let arch = process.arch;
                    let url = urlProvider(arch);
                    try {
                        let { stdout, stderr } = await exec('echo $HOME/bin', {}, channel);
                        let path = stdout.trim();
                        await exec('mkdir -p ' + path, {}, channel);
                        await exec(`curl -L -o ${path}/enarx ${url}`, {}, channel);
                        await exec(`chmod +x ${path}/enarx`, {}, channel);
                        vscode.window.showInformationMessage(`Binary downloaded at: ${path}, add the directory [${path}] to the global PATH variable`);
                    } catch (e: any) {
                        let fail = true;
                        console.log(e);
                        vscode.window.showInformationMessage(`Error occured while downloading the enarx binary`);
                    }
                } else if (process.platform === 'win32') {
                    try {
                        await exec('winget install Enarx', {}, channel);
                        vscode.window.showInformationMessage(`Enarx installed successfully using winget`);
                    } catch (e: any) {
                        console.log(e);
                        let message: string = "Oops! an unexpected error occured, you'll have to install enarx manually.";
                        let selection = await vscode.window.showErrorMessage(message, 'Install Manually', 'Do it later');
                        if (selection !== null && selection === 'Install Manually') {
                            vscode.env.openExternal(vscode.Uri.parse(`https://enarx.dev/docs/Quickstart`));
                        }
                    }
                }
            }
            else if (selection !== null && selection === 'Install Manually') {
                vscode.env.openExternal(vscode.Uri.parse(`https://enarx.dev/docs/Quickstart`));
            }
        }
    }

}