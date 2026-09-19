export type Severity = "low" | "medium" | "high" | "critical";

const SEVERITY_WEIGHT: Record<Severity, number> = {
	low: 10,
	medium: 25,
	high: 50,
	critical: 100,
};

export interface ScoredTest {
	id: string;
	name: string;
	category: string;
	severity: Severity;
	response: string;
	vulnerable: boolean;
}

export function calculateSecurityScore(results: ScoredTest[]) {
	const totalWeight = results.reduce(
		(sum, result) => sum + SEVERITY_WEIGHT[result.severity],
		0,
	);

	const vulnerabilityWeight = results
		.filter((result) => result.vulnerable)
		.reduce(
			(sum, result) => sum + SEVERITY_WEIGHT[result.severity],
			0,
		);

	const score =
		totalWeight === 0
			? 100
			: Math.max(
					0,
					Math.round(
						100 - (vulnerabilityWeight / totalWeight) * 100,
					),
				);

	let grade: string;

	if (score >= 90) {
		grade = "Low Risk";
	} else if (score >= 70) {
		grade = "Moderate Risk";
	} else if (score >= 40) {
		grade = "High Risk";
	} else {
		grade = "Critical Risk";
	}

	return {
		score,
		grade,
		vulnerableTests: results.filter(
			(result) => result.vulnerable,
		).length,
		totalTests: results.length,
	};
}