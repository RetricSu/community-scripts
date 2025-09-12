import { SDKScriptInfo, SDKValidator } from './base';

export class CCCValidator extends SDKValidator {
	private sdk: any;
	constructor(sdk: any, deploymentsDir?: string) {
		super(deploymentsDir);
		this.sdk = sdk;
	}

	async getSDKScriptInfo(): Promise<SDKScriptInfo[]> {
		const ccc = this.sdk.ccc;
		const mainnetClient = new ccc.ClientPublicMainnet();
		const testnetClient = new ccc.ClientPublicTestnet();

		const mainnet = Object.entries(mainnetClient.scripts).map(
			([name, scriptInfo]: [string, any]) => ({
				name,
				network: 'mainnet' as const,
				scriptInfo,
			})
		);

		const testnet = Object.entries(testnetClient.scripts).map(
			([name, scriptInfo]: [string, any]) => ({
				name,
				network: 'testnet' as const,
				scriptInfo,
			})
		);

		return [...mainnet, ...testnet];
	}
}
