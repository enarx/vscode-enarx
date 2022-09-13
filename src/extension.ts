import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import { IValidationProvider } from './validationProvider/validationProvider';
import { TomlValidationProvider } from './validationProvider/tomlValidationProvider';
import { ICodexProvider } from './CodexProvider/codexProvider';
import { GithubCodexProvider } from './CodexProvider/GithubCodexProvider';
import { ENARX_TOML_EXAMPLE } from './EnarxTomlExample';


export function activate(context: vscode.ExtensionContext) {
	let scafoldEnarxToml = vscode.commands.registerCommand('vscode-enarx.scafoldEnarxToml', () => {
		if (vscode.workspace.workspaceFolders) {
			try {
				fs.writeFileSync(`${vscode.workspace.workspaceFolders[0].uri.fsPath}/Enarx.toml`, ENARX_TOML_EXAMPLE);
			} catch (e) {
				vscode.window.showErrorMessage("We couldn't create an Enarx.toml file at the workspace location", "Ok");
			}
		} else {
			vscode.window.showErrorMessage('We couldn\'t create a Enarx.toml since you are working outside any workspace.');
		}
	});
	let enarxTomlValidation = vscode.commands.registerCommand('vscode-enarx.enarxTomlValidation', () => {
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
	let enarxCodex = vscode.commands.registerCommand('vscode-enarx.codexPull', async () => {
		let codex: ICodexProvider = new GithubCodexProvider();
		let s = await codex.getCodexRepos();
		let selectedRepo = await vscode.window.showQuickPick(s.map(v => ({ label: v } as vscode.QuickPickItem)));
		if (selectedRepo) {
			if (vscode.workspace.workspaceFolders && (process.platform === 'linux' || process.platform === 'darwin')) {
				vscode.window.showInformationMessage("Pulling code for: " + selectedRepo.label);
				try {
					const commandToExtract = `curl https://codeload.github.com/enarx/codex/tar.gz/refs/heads/main | tar -zx --directory ${vscode.workspace.workspaceFolders[0].uri.fsPath} ./codex-main/${selectedRepo.label}`;
					cp.execSync(commandToExtract);
					cp.execSync(`mv ${vscode.workspace.workspaceFolders[0].uri.fsPath}/codex-main/${selectedRepo.label}/* ${vscode.workspace.workspaceFolders[0].uri.fsPath}`);
					cp.execSync(`rm -rf ${vscode.workspace.workspaceFolders[0].uri.fsPath}/codex-main`);
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
	context.subscriptions.push(scafoldEnarxToml, enarxCodex, enarxTomlValidation);
}

// this method is called when your extension is deactivated
export function deactivate() { }
