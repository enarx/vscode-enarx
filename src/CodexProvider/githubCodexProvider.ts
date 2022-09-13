import { ICodexProvider } from "./codexProvider";
import axios from 'axios';

interface Tree {
    path: string;
    mode: string;
    type: string;
    sha: string;
    url: string;
    size?: number;
}

interface APIReponseStructure {
    sha: string;
    url: string;
    tree: Tree[];
    truncated: boolean;
}

export class GithubCodexProvider implements ICodexProvider {
    async getCodexRepos(): Promise<string[]> {
        let result =  await axios.get('https://api.github.com/repos/enarx/codex/git/trees/main?recursive=true&truncated=false');
        if (result.status!== 200){
            return [];
        } else {
            try {
            let resultData = result.data as APIReponseStructure;
            return resultData.tree.filter( v => (/^.*\/.*\/Enarx.toml$/).test(v.path)).map(v => v.path).map(v => v.replace("/Enarx.toml", ""));
            }
            catch(e) {
                return [];
            }
        }
    }
}