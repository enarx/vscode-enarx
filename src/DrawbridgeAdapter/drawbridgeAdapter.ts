/* eslint-disable @typescript-eslint/naming-convention */
import { ExtensionContext } from "vscode";
import * as openid from 'openid-client';
import * as vscode from 'vscode';

export class DrawbridgeAdapter {
    context?:vscode.ExtensionContext;
    constructor(context?: vscode.ExtensionContext) {
        this.context = context;
    }

    async login() {
        let issuer = await openid.Issuer.discover("https://auth.profian.com");
        let client = new issuer.Client({
            client_id: '4NuaJxkQv8EZBeJKE56R57gKJbxrTLG2',
            token_endpoint_auth_method: 'none'
        });
        // let client = new openid.BaseClient({ client_id: '4NuaJxkQv8EZBeJKE56R57gKJbxrTLG2', token_endpoint_auth_method: 'client_secret_post'});
        // client.issuer.metadata.authorization_endpoint = 'https://auth.profian.com/authorize';
        // client.issuer.metadata.token_endpoint = 'https://auth.profian.com/oauth/token';
        // client.issuer.metadata.mtls_endpoint_aliases = {
        // 	device_authorization_endpoint: 'https://auth.profian.com/oauth/oauth/device/code',
        // 	token_endpoint: 'https://auth.profian.com/oauth/token'
        // };
        let a = await client.deviceAuthorization();
        let aa = await vscode.window.showInformationMessage(`Login proceedure started, continue by opening the authorization website and entering the user code [${a.user_code}]. Continue opening the authorization website and copy user code to clipboard.`,
            'Continue',
            'Abort'
        );
        if (aa === 'Continue') {
            await vscode.env.clipboard.writeText(a.user_code);
            vscode.env.openExternal(vscode.Uri.parse(a.verification_uri));
            if (!a.expired()) {
                try {
                    let s: openid.TokenSet = await a.poll();
                    s.expires_at;
                    let curr = new Date().getTime();
                    await this.context?.globalState.update('auth', s);
                    vscode.window.showInformationMessage('Login Successful!');
                } catch (e: any) {
                    vscode.window.showErrorMessage('ERROR!');
                    console.error(e);
                }
            }
        }
    }
    
    loadToken(): openid.TokenSet | undefined{
        return this.context?.globalState.get<openid.TokenSet>('auth');
    }
}