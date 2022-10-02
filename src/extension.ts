import * as vscode from 'vscode';
import { exec } from './exec';
import { installEnarxProceedure } from './enarxInstall';
import * as fs from 'fs';
import { IValidationProvider } from './validationProvider/validationProvider';
import { TomlValidationProvider } from './validationProvider/tomlValidationProvider';
import { ICodexProvider } from './CodexProvider/codexProvider';
import { GithubCodexProvider } from './CodexProvider/GithubCodexProvider';
import { ENARX_TOML_EXAMPLE } from './EnarxTomlExample';
import { GithubRepoReleaseResponse } from './githubApiDAO';
import axios from 'axios';

async function getLatestRelease(): Promise<GithubRepoReleaseResponse> {
	let response = await axios.get('https://api.github.com/repos/enarx/enarx/releases');
	if (response.status === 200) {
		let repoReleases = response.data as GithubRepoReleaseResponse[];
		if (repoReleases.length > 0) {
			return repoReleases[0];
		}
	}
	throw new Error("error: release not found");
}
export interface Backend {
	backend: string;
	data: any[];
}

export interface PlatformInfo {
	version: string;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	system_info: string;
	backends: Backend[];
}


async function getPlatformInfo(): Promise<PlatformInfo> {
	try {
		let { stdout } = await exec('enarx platform info -j', {});
		let outputJSON = JSON.parse(stdout);
		return (outputJSON as PlatformInfo);
	} catch (e: any) {
		if (e instanceof SyntaxError) {
			throw new Error("error: Output of the platform is invalid.");
		}
		throw new Error("error: command not found");
	}
}

enum ReleaseStatus {
	newReleaseAvailable,
	upToDate
}
function compareRelease(current: string, latest: string): ReleaseStatus {
	let sanatize = (version: string): number[] => {
		version = version.replace("v", '');
		let parts = version.split(".").map((v: string) => parseInt(v));
		return parts;
	};
	let currentParts = sanatize(current);
	let latestParts = sanatize(latest);
	for (let p = 0; p < currentParts.length; p++) {
		if (currentParts[p] < latestParts[p]) {
			return ReleaseStatus.newReleaseAvailable;
		}
	}
	return ReleaseStatus.upToDate;
}

export async function activate(context: vscode.ExtensionContext) {
	let channel = vscode.window.createOutputChannel('Enarx Extension Output channel');
	channel.show();
	try {
		let platformInfo = await getPlatformInfo();
		let latestReleaseInfo = await getLatestRelease();
		let releaseStatus = compareRelease(platformInfo.version, latestReleaseInfo.name);
		if (releaseStatus === ReleaseStatus.newReleaseAvailable) {
			let selection = await vscode.window.showInformationMessage(`New update available [${latestReleaseInfo.name}], do you want to update?`, "Yes", "Do it later");
			if (selection === "Yes") {
				if (process.platform === 'darwin') {
					vscode.window.showInformationMessage('Starting to install enarx on your local machine');
					try {
						await exec('brew upgrade enarx/enarx/enarx', {}, channel);
						vscode.window.showInformationMessage('Enarx was installed successfully!');
					} catch (e: any) {
						let err = e.error;
						let message: string = "Oops! an unexpected error occured, you'll have to install enarx manually.";
						if (err?.hasOwnProperty('code') && isFinite(err?.code) && err?.code === 127) {
							message = 'Brew is not installed! You need to install enarx manually.';
						}
						let selection = await vscode.window.showErrorMessage(message, 'Update Manually', 'Do it later');
						if (selection !== null && selection === 'Update Manually') {
							vscode.env.openExternal(vscode.Uri.parse(`https://enarx.dev/docs/Quickstart`));
						}
					}
				} else if (process.platform === 'linux') {
					let arch = process.arch;
					let url = ((arch: string): string => {
						for (let asset of latestReleaseInfo.assets) {
							let assetNameRegex = (arch === 'arm64') ? /.*aarch64.*linux.*/ : (arch === 'x64') ? /.*x86_64.*linux.*/ : null;
							if (assetNameRegex && assetNameRegex.test(asset.name)) {
								return asset.browser_download_url;
							}
						}
						throw new Error("error: asset not found for the platform");
					})(arch);
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
						await exec('winget upgrade Enarx', {}, channel);
						vscode.window.showInformationMessage(`Enarx installed successfully using winget`);
					} catch (e: any) {
						console.log(e);
						let message: string = "Oops! an unexpected error occured, you'll have to install enarx manually.";
						let selection = await vscode.window.showErrorMessage(message, 'Update Manually', 'Do it later');
						if (selection !== null && selection === 'Update Manually') {
							vscode.env.openExternal(vscode.Uri.parse(`https://enarx.dev/docs/Quickstart`));
						}
					}
				}
			}
		}
	} catch (e: any) {

	}


	vscode.window.showInformationMessage('Enarx entension activated');

	installEnarxProceedure(context, channel);
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
					await exec(commandToExtract, {}, channel);
					await exec(`rsync -a ${vscode.workspace.workspaceFolders[0].uri.fsPath}/codex-main/${selectedRepo.label}/* ${vscode.workspace.workspaceFolders[0].uri.fsPath}`, {}, channel);
					await exec(`rm -rf ${vscode.workspace.workspaceFolders[0].uri.fsPath}/codex-main`, {}, channel);
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
