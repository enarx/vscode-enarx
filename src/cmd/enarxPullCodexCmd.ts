import * as vscode from 'vscode';
import { ICodexProvider } from '../CodexProvider/codexProvider';
import { GithubCodexProvider } from '../CodexProvider/githubCodexProvider';
import { exec } from '../exec';

function makeid(length: number): string {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

export default function enarxPullCodexCmdFactory(channel : vscode.OutputChannel): vscode.Disposable {
    return vscode.commands.registerCommand('vscode-enarx.codexPull', async () => {
        let codex: ICodexProvider = new GithubCodexProvider();
        let s = await codex.getCodexRepos();
        let selectedRepo = await vscode.window.showQuickPick(s.map(v => ({ label: v } as vscode.QuickPickItem)));
        if (selectedRepo) {
            if (vscode.workspace.workspaceFolders && (process.platform === 'linux' || process.platform === 'darwin')) {
                vscode.window.showInformationMessage("Pulling code for: " + selectedRepo.label);
                try {
                    const path = `/tmp/${makeid(20)}`;
                    const commandToExtract = `curl https://codeload.github.com/enarx/codex/tar.gz/refs/heads/main | tar -zx --directory ${path} codex-main/${selectedRepo.label}`;
                    await exec('mkdir -p ' + path, {}, channel);
                    await exec(commandToExtract, {}, channel);
                    await exec(`rsync -a ${path}/codex-main/${selectedRepo.label}/* ${vscode.workspace.workspaceFolders[0].uri.fsPath}`, {}, channel);
                    await exec(`rm -rf ${path}/codex-main`, {}, channel);
                    vscode.window.showInformationMessage(`Workspace ready with ${selectedRepo.label}`);
                } catch (e) {
                    vscode.window.showInformationMessage("Oops! we can't automatically setup the workspace for you.", "Configure Manually", "Do it later").then(select => {
                        if (select === 'Configure Manually') {
                            vscode.env.openExternal(vscode.Uri.parse(`https://github.com/enarx/codex/tree/main/${selectedRepo?.label}`));
                        }
                    });
                }
            } else {
                vscode.window.showInformationMessage("Oops! we can't automatically setup the workspace for you.", "Configure Manually", "Do it later").then(select => {
                    if (select === 'Configure Manually') {
                        vscode.env.openExternal(vscode.Uri.parse(`https://github.com/enarx/codex/tree/main/${selectedRepo?.label}`));
                    }
                });
            }
        }
    });
}