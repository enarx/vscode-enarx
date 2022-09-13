export interface ICodexProvider {
    getCodexRepos(): Promise<string[]>;
}