import { mkdirSync } from "node:fs";
import { writeFile, readFile, readdir, stat, unlink, access } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import type { Rule, RulesData } from "../types/index.ts";

// TTL configuration
const RULES_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 100; // max firms in memory

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

	private static cleanupStarted = false;

	constructor(rulesDir = join(process.cwd(), "rules", "dynamic")) {
		this.rulesDir = rulesDir;
		ensureDir(this.rulesDir);
		this.startCleanupTimer();
	}

	/**
	 * Starts the TTL cleanup timer (only once per process)
	 */
	private startCleanupTimer() {
		if (RulesStorage.cleanupStarted) return;
		RulesStorage.cleanupStarted = true;

		// Run cleanup immediately on startup
		this.cleanupOldRules().catch((err) =>
			console.error("[RulesStorage] Initial cleanup failed:", err)
		);

		// Schedule periodic cleanup
		const handle = setInterval(() => {
			this.cleanupOldRules().catch((err) =>
				console.error("[RulesStorage] Periodic cleanup failed:", err)
			);
		}, CLEANUP_INTERVAL_MS);

		// Don't keep process alive just for this timer (if supported)
		(handle as unknown as { unref?: () => void }).unref?.();

		console.log(
			`[RulesStorage] TTL cleanup started: ${RULES_TTL_MS / 1000 / 60 / 60}h TTL, checking every ${CLEANUP_INTERVAL_MS / 1000 / 60} min`
		);
	}

	/**
	 * Deletes rule files older than RULES_TTL_MS based on file mtime
	 */
	private async cleanupOldRules(): Promise<void> {
		const now = Date.now();

		let files: string[];
		try {
			files = await readdir(this.rulesDir);
		} catch {
			return; // directory doesn't exist or can't be read
		}

		const ruleFiles = files.filter((f) => f.endsWith("_rules.json"));

		for (const file of ruleFiles) {
			const fullPath = join(this.rulesDir, file);

			try {
				const info = await stat(fullPath);
				const ageMs = now - info.mtimeMs;

				if (ageMs > RULES_TTL_MS) {
					await unlink(fullPath);

					// Also remove from in-memory cache
					const firmName = file.replace("_rules.json", "");
					this.cache.delete(firmName);

					console.log(
						`[RulesStorage] Deleted expired rules: ${file} (age: ${Math.round(ageMs / 1000 / 60 / 60)}h)`
					);
				}
			} catch {
				// ignore errors (file deleted concurrently, permissions, etc.)
			}
		}
	}

	/**
	 * Evicts oldest entries if cache exceeds MAX_CACHE_SIZE
	 */
	private evictCacheIfNeeded() {
		if (this.cache.size <= MAX_CACHE_SIZE) return;

		// Simple FIFO eviction: Map maintains insertion order
		const toDelete = this.cache.size - MAX_CACHE_SIZE;
		const keys = this.cache.keys();

		for (let i = 0; i < toDelete; i++) {
			const { value: key } = keys.next();
			if (key) this.cache.delete(key);
		}
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
		this.evictCacheIfNeeded();
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
		this.evictCacheIfNeeded();
		return parsed;
	}

	private getFilePath(firmName: string): string {
		const fileName = `${normalizeFirmName(firmName)}_rules.json`;
		return join(this.rulesDir, fileName);
	}
}
