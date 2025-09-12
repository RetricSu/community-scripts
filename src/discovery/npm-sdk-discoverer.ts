import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface NPMPackage {
	name: string;
	version: string;
	description?: string;
	repository?: string;
}

export class NPMSDKDiscoverer {
	async discoverSDKs(): Promise<string[]> {
		console.log('🔍 Discovering CKB SDK packages on npm...');

		const patterns = ['ckb-sdk', 'nervos-sdk', 'ckb-js', 'ckb'];
		const allPackages = new Set<string>();

		for (const pattern of patterns) {
			try {
				const packages = await this.searchNPM(pattern);
				packages.forEach((pkg) => allPackages.add(pkg.name));
				console.log(
					`Found ${packages.length} packages matching "${pattern}"`
				);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				console.warn(
					`Failed to search for pattern "${pattern}": ${errorMessage}`
				);
			}
		}

		const uniquePackages = Array.from(allPackages);
		console.log(
			`📦 Total unique SDK packages found: ${uniquePackages.length}`
		);
		return uniquePackages;
	}

	private async searchNPM(pattern: string): Promise<NPMPackage[]> {
		try {
			const { stdout } = await execAsync(`pnpm search ${pattern} --json`);
			const results = JSON.parse(stdout);
			return results.map((pkg: any) => ({
				name: pkg.name,
				version: pkg.version,
				description: pkg.description,
				repository: pkg.repository?.url,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.warn(`NPM search failed for "${pattern}": ${errorMessage}`);
			return [];
		}
	}

	async getPackageInfo(packageName: string): Promise<NPMPackage | null> {
		try {
			const { stdout } = await execAsync(
				`pnpm view ${packageName} --json`
			);
			const info = JSON.parse(stdout);
			return {
				name: info.name,
				version: info.version,
				description: info.description,
				repository: info.repository?.url,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.warn(
				`Failed to get info for ${packageName}: ${errorMessage}`
			);
			return null;
		}
	}

	async getLatestVersion(packageName: string): Promise<string | null> {
		try {
			const { stdout } = await execAsync(
				`pnpm view ${packageName} version`
			);
			return stdout.trim();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.warn(
				`Failed to get latest version for ${packageName}: ${errorMessage}`
			);
			return null;
		}
	}
}
