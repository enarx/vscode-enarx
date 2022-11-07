import * as vscode from 'vscode';
import scafoldEnarxTomlCmdFactory from './cmd/scafoldEnarxTomlCmd';
import enarxTomlValidationCmdFactory from './cmd/enarxTomlValidationCmd';
import enarxPullCodexCmdFactory from './cmd/enarxPullCodexCmd';
import { EnarxCliAdapter, ReleaseStatus } from './enarxCliAdapter/enarxCliAdapter';
import { DrawbridgeAdapter } from './DrawbridgeAdapter/drawbridgeAdapter';
import drawbridgeLoginCmdFactory from './cmd/drawbridgeLoginCmd';
import enarxCliInstallCmdFactory from './cmd/enarxCliInstallCmd';
import enarxCliUpdateLatestReleaseCmdFactory from './cmd/enarxCliUpdateLatestRelease';
import setupWasmToolsCmdFactory from './cmd/setupWASMTools';

export async function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('Enarx entension activated');
	let channel = vscode.window.createOutputChannel('Enarx Extension Output channel');
	let enarx = new EnarxCliAdapter(channel);
	let drawbridgeAdapter = new DrawbridgeAdapter(context);
	channel.show();
	(async () => {
		try {
			let token = drawbridgeAdapter.loadToken();
			if (token?.expires_at && token?.expires_at < (Date.now() / 1000)) {
				vscode.window.showInformationMessage("Drawbridge session expired!", 'OK');
				await drawbridgeAdapter.login();
			}
		} catch (e: any) { }
	})();

	(async () => {
		try {
			let releaseStatus = await enarx.installedReleaseStatus();
			if (releaseStatus === ReleaseStatus.newReleaseAvailable) {
				let latestReleaseInfo = await enarx.getLatestRelease();
				let selection = await vscode.window.showInformationMessage(`New update available [${latestReleaseInfo.name}], do you want to update?`, "Yes", "Do it later");
				if (selection === "Yes") {
					await enarx.updateEnarxCli(latestReleaseInfo);
				}
			}
		} catch (e: any) { }
	})();

	enarx.installEnarxProceedure();

	context.subscriptions.push(
		setupWasmToolsCmdFactory(),
		enarxCliUpdateLatestReleaseCmdFactory(enarx),
		enarxCliInstallCmdFactory(enarx),
		scafoldEnarxTomlCmdFactory(),
		drawbridgeLoginCmdFactory(drawbridgeAdapter),
		enarxPullCodexCmdFactory(channel),
		enarxTomlValidationCmdFactory()
	);
}

// this method is called when your extension is deactivated
export function deactivate() { }
