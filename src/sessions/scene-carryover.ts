// Pure — no `obsidian` import. Optional scene carry-over between sessions:
// the `scene-carryover` feature (prep's played toggle + "Bring over
// unplayed"), and on top of it the `carryScenes` setting, which seeds each new
// session's Scenes with the latest session's unplayed rows.
//
// Unlike secrets (carryover.ts), scenes have no ids and no history — they're
// body bullets — so this only ever looks at the single latest prior session.
// That keeps it simple and means a carried scene the GM deletes stays deleted:
// there's no older copy for a later carry to resurrect.

import { parseTaskBulletSection, renderTaskBulletRows, type TaskRow } from "./bullet-list";
import { sectionContent } from "../lib/sections";
import { featureEnabled } from "../features";
import type { LazyCampaignPluginSettings } from "../settings/settings";
import type { SessionModel } from "./types";

type CarrySettings = Pick<LazyCampaignPluginSettings, "disabledFeatures" | "carryScenes">;

/** The feature switch: prep's played toggle and "Bring over unplayed". */
export function sceneCarryEnabled(settings: CarrySettings): boolean {
	return featureEnabled(settings, "scene-carryover");
}

/** Automatic carry at session creation — needs the feature on as well. */
export function autoCarryScenes(settings: CarrySettings): boolean {
	return sceneCarryEnabled(settings) && settings.carryScenes;
}

/** The not-done rows (detail blocks included) of a session body's Scenes
 * section. Done flags never carry — every carried row is a fresh `- [ ]`. */
export function unplayedScenes(priorBody: string): TaskRow[] {
	return parseTaskBulletSection(sectionContent(priorBody, "Scenes"))
		.rows.filter((row) => !row.done)
		.map((row) => ({ ...row, done: false }));
}

/** Rendered Scenes section content to seed the next session with ("" when
 * nothing is left unplayed). */
export function carryScenesContent(priorBody: string): string {
	return renderTaskBulletRows(unplayedScenes(priorBody));
}

/** "Bring over unplayed" for an existing session: the prior body's unplayed
 * rows minus any whose text the current list already has (trimmed,
 * case-insensitive), so pressing it twice never duplicates. */
export function scenesToBringOver(priorBody: string, currentTexts: readonly string[]): TaskRow[] {
	const have = new Set(currentTexts.map(sceneKey));
	return unplayedScenes(priorBody).filter((row) => !have.has(sceneKey(row.text)));
}

function sceneKey(text: string): string {
	return text.trim().toLowerCase();
}

/** The session scene carry-over reads from: highest session number, same
 * tie-break as secret carry-over (later `date`, then later `path`). */
export function latestSession(sessions: readonly SessionModel[]): SessionModel | null {
	let best: SessionModel | null = null;
	for (const s of sessions) {
		if (
			!best ||
			s.session > best.session ||
			(s.session === best.session &&
				((s.date ?? "").localeCompare(best.date ?? "") > 0 ||
					((s.date ?? "") === (best.date ?? "") && s.path.localeCompare(best.path) > 0)))
		) {
			best = s;
		}
	}
	return best;
}
