import axios from 'axios';
import * as vscode from 'vscode';
import { exec } from '../exec';
import { GithubRepoReleaseResponse } from '../githubApiDAO';

interface Backend {
    backend: string;
    data: any[];
}

interface PlatformInfo {
    version: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    system_info: string;
    backends: Backend[];
}


export class EnarxCommandNotFound extends Error {
    constructor() {
        super('error: enarx cli not found');
    }
}
export class EnarxOutputInvalid extends Error {
    constructor() {
        super('error: Output of the enarx cli is invalid');
    }
}
export enum ReleaseStatus {
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
export class EnarxCliAdapter {
    private outputChannel?: vscode.OutputChannel;
    constructor(outputChannel?: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    public async getPlatformInfo(): Promise<PlatformInfo> {
        try {
            let { stdout } = await exec('enarx platform info -j', {}, this.outputChannel);
            let outputJSON = JSON.parse(stdout);
            return (outputJSON as PlatformInfo);
        } catch (e: any) {
            if (e instanceof SyntaxError) {
                throw new EnarxOutputInvalid();
            }
            throw new EnarxCommandNotFound();
        }
    }
    async getLatestRelease(): Promise<GithubRepoReleaseResponse> {
        let response = await axios.get('https://api.github.com/repos/enarx/enarx/releases');
        if (response.status === 200) {
            let repoReleases = response.data as GithubRepoReleaseResponse[];
            if (repoReleases.length > 0) {
                return repoReleases[0];
            }
        }
        throw new Error("error: release not found");
    }

    async installedReleaseStatus(): Promise<ReleaseStatus> {
        let platformInfo = await this.getPlatformInfo();
        let latestReleaseInfo = await this.getLatestRelease();
        let releaseStatus = compareRelease(platformInfo.version, latestReleaseInfo.name);
        return releaseStatus;
    }

    private async getPlatformAssetUrl(releaseInfo: GithubRepoReleaseResponse): Promise<string> {
        let arch = process.arch;
        let url = ((arch: string): string => {
            for (let asset of releaseInfo.assets) {
                let assetNameRegex = (arch === 'arm64') ? /.*aarch64.*linux.*/ : (arch === 'x64') ? /.*x86_64.*linux.*/ : null;
                if (assetNameRegex && assetNameRegex.test(asset.name)) {
                    return asset.browser_download_url;
                }
            }
            throw new Error("error: asset not found for the platform");
        })(arch);
        return url;
    }

    async updateEnarxCli(latestReleaseInfo: GithubRepoReleaseResponse) {
        if (process.platform === 'darwin') {
            vscode.window.showInformationMessage('Starting to install enarx on your local machine');
            try {
                await exec('brew upgrade enarx/enarx/enarx', {}, this.outputChannel);
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
            let url = this.getPlatformAssetUrl(latestReleaseInfo);
            try {
                let { stdout, stderr } = await exec('echo $HOME/.enarx/bin', {});
                let path = stdout.trim();
                await exec('mkdir -p ' + path, {}, this.outputChannel);
                await exec(`curl -L -o ${path}/enarx ${url}`, {}, this.outputChannel);
                await exec(`chmod +x ${path}/enarx`, {}, this.outputChannel);
                vscode.window.showInformationMessage(`Binary downloaded at: ${path}, add the directory [${path}] to the global PATH variable`);
            } catch (e: any) {
                let fail = true;
                vscode.window.showInformationMessage(`Error occured while downloading the enarx binary`);
            }
        } else if (process.platform === 'win32') {
            try {
                await exec('winget upgrade Enarx', {}, this.outputChannel);
                vscode.window.showInformationMessage(`Enarx installed successfully using winget`);
            } catch (e: any) {
                let message: string = "Oops! an unexpected error occured, you'll have to install enarx manually.";
                let selection = await vscode.window.showErrorMessage(message, 'Update Manually', 'Do it later');
                if (selection !== null && selection === 'Update Manually') {
                    vscode.env.openExternal(vscode.Uri.parse(`https://enarx.dev/docs/Quickstart`));
                }
            }
        }
    }
    async installEnarxProceedure() {
        try {
            await this.getPlatformInfo();
        } catch (exception: any) {
            console.log(exception);
            if (exception instanceof EnarxOutputInvalid) {
                vscode.window.showInformationMessage('enarx cli is not working as expected, please open an issue with a screenshot of command output: enarx platform info -j', 'Open an issue', 'Disregard')
                    .then(selection => {
                        if (selection === 'Open an issue') {
                            vscode.env.openExternal(vscode.Uri.parse('https://github.com/enarx/vscode-enarx/issues'));
                        }
                    });
            }
            else if (exception instanceof EnarxCommandNotFound) {
                let selection = await vscode.window.showErrorMessage('Enarx is not fount to be intalled, do you want to automatically install enarx?', 'Yes', 'Install Manually', 'Remind me later');
                if (selection !== null && selection === 'Yes') {
                    console.log(process.platform);
                    if (process.platform === 'darwin') {
                        vscode.window.showInformationMessage('Starting to install enarx on your local machine');
                        try {
                            await exec('brew install enarx/enarx/enarx', {}, this.outputChannel);
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
                        let latestReleaseInfo = await this.getLatestRelease();
                        let url = await this.getPlatformAssetUrl(latestReleaseInfo);
                        try {
                            let { stdout, stderr } = await exec('echo $HOME/.enarx/bin', {}, this.outputChannel);
                            let path = stdout.trim();
                            await exec('mkdir -p ' + path, {}, this.outputChannel);
                            await exec(`curl -L -o ${path}/enarx ${url}`, {}, this.outputChannel);
                            await exec(`chmod +x ${path}/enarx`, {}, this.outputChannel);
                            vscode.window.showInformationMessage(`Binary downloaded at: ${path}, add the directory [${path}] to the global PATH variable`);
                        } catch (e: any) {
                            vscode.window.showInformationMessage(`Error occured while downloading the enarx binary`);
                        }
                    } else if (process.platform === 'win32') {
                        try {
                            await exec('winget install Enarx', {}, this.outputChannel);
                            vscode.window.showInformationMessage(`Enarx installed successfully using winget`);
                        } catch (e: any) {
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
}