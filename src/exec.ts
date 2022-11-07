import * as vscode from 'vscode';
import * as cp from 'child_process';

export function exec(command: string, options: cp.ExecOptions, channel?: vscode.OutputChannel): Promise<{ stdout: string; stderr: string }> {
	return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
		let o = cp.exec(command, options, (error, stdout, stderr) => {
			if (error) {
				reject({ error, stdout, stderr });
			}
			resolve({ stdout, stderr });
		});
		if (channel) {
			channel.appendLine(command);
			o.stdout?.on('data', (data) => channel.appendLine(data.toString()));
			o.stderr?.on('data', (data) => channel.appendLine(data.toString()));
			o.on('exit', (code) => {
				channel.appendLine('Process exited with code: ' + code + "\n");
			});
		}
	});
}