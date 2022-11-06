import * as vscode from 'vscode';
import { EnarxCliAdapter, EnarxCommandNotFound, ReleaseStatus } from '../enarxCliAdapter/enarxCliAdapter';

export default function enarxCliUpdateLatestReleaseCmdFactory(enarx: EnarxCliAdapter) {
    return vscode.commands.registerCommand('vscode-enarx.enarxCliUpdateLatestRelease', async () => {
        try {
            let releaseStatus = await enarx.installedReleaseStatus();
            if (releaseStatus === ReleaseStatus.newReleaseAvailable) {
                let latestReleaseInfo = await enarx.getLatestRelease();
                let selection = await vscode.window.showInformationMessage(`New update available [${latestReleaseInfo.name}], do you want to update?`, "Yes", "Do it later");
                if (selection === "Yes") {
                    await enarx.updateEnarxCli(latestReleaseInfo);
                }
            }
        } catch (e: any) {
            if (e instanceof EnarxCommandNotFound) {
                vscode.window.showErrorMessage("Enarx CLI is not installed, installing Enarx CLI for the current platform");
                enarx.installEnarxProceedure();
            }
        }
    });
}