/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

export async function setupWasmToolsProvider() {
    let langHelpMap:any = {
        "Rust": "https://enarx.dev/docs/WebAssembly/Rust",
        "C++": "https://enarx.dev/docs/WebAssembly/C++",
        "C":"https://enarx.dev/docs/WebAssembly/C",
        "Golang": "https://enarx.dev/docs/WebAssembly/Golang",
        "JavaScript": "https://enarx.dev/docs/WebAssembly/JavaScript",
        "TypeScript": "https://enarx.dev/docs/WebAssembly/TypeScript",
        "Python": "https://enarx.dev/docs/WebAssembly/Python",
        ".NET/C#": "https://enarx.dev/docs/WebAssembly/dotnet",
        "Java": "https://enarx.dev/docs/WebAssembly/Java",
        "Zig": "https://enarx.dev/docs/WebAssembly/Zig",
        "Ruby": "https://enarx.dev/docs/WebAssembly/Ruby",
        "Swift": "https://enarx.dev/docs/WebAssembly/Swift",
        "AsemblyScript": "https://enarx.dev/docs/WebAssembly/AssemblyScript",
        "Grain": "https://enarx.dev/docs/WebAssembly/Grain"
    };
    let choice = await vscode.window.showQuickPick(Object.keys(langHelpMap), {title: "Select language you want help with"});
    if (choice) {
        if (langHelpMap[choice]) {
            let selection = await vscode.window.showInformationMessage('Oops! Sorry we can\'t automatically install the tools for compiling code to WASM.', 'Install Manually', 'Do it later');
            if (selection === 'Install Manually') {
                vscode.env.openExternal(vscode.Uri.parse(langHelpMap[choice]));
            }
        }
    } 
}