import { mkdirSync } from "node:fs";
import { writeFile, readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import type { Rule, RulesData } from "../types/index.ts";

function ensureDir(path: string) {
	try {
		mkdirSync(path, { recursive: true });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
			throw error;
		}
	}
}

function normalizeFirmName(firmName: string): string {
	return firmName.trim().toLowerCase().replace(/\s+/g, "_");
}

export class RulesStorage {
	private cache = new Map<string, RulesData>();
	private rulesDir: string;

	constructor(rulesDir = join(process.cwd(), "rules", "dynamic")) {
		this.rulesDir = rulesDir;
		ensureDir(this.rulesDir);
	}

	async saveRules(
		firmName: string,
		rules: Rule[],
		totalIterations: number
	): Promise<RulesData> {
		const now = new Date().toISOString();
		const policyVersion = `${new Date().getFullYear()}-${String(
			new Date().getMonth() + 1
		).padStart(2, "0")}`;
		const data: RulesData = {
			firm_name: firmName,
			policy_version: policyVersion,
			last_updated: now,
			generated_by_llm: true as const,
			total_iterations: totalIterations,
			rules,
		};

		const filePath = this.getFilePath(firmName);
		ensureDir(dirname(filePath));
		await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
		this.cache.set(firmName, data);
		return data;
	}

	async loadRules(firmName: string): Promise<RulesData | null> {
		if (this.cache.has(firmName)) {
			return this.cache.get(firmName)!;
		}

		const filePath = this.getFilePath(firmName);
		try {
			await access(filePath, constants.F_OK);
		} catch {
			return null;
		}

		const contents = await readFile(filePath, "utf-8");
		const parsed = JSON.parse(contents) as RulesData;
		this.cache.set(firmName, parsed);
		return parsed;
	}

	private getFilePath(firmName: string): string {
		const fileName = `${normalizeFirmName(firmName)}_rules.json`;
		return join(this.rulesDir, fileName);
	}
}
