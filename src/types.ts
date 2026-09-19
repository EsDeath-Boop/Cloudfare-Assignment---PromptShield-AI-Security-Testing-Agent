export interface DeepScanParams {
	systemPrompt: string;
	attacksPerCategory: number;
}

export interface Env {
	AI: Ai;
    DB: D1Database;
	DEEP_SCAN_WORKFLOW: Workflow<DeepScanParams>;
	ASSETS: Fetcher;
}