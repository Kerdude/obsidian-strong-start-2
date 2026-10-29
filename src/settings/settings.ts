// Pure settings model — no `obsidian` import, so tests can import it.
export interface LazyCampaignPluginSettings {
	/** Root folder for campaign folders/notes, relative to the vault root. */
	campaignRoot: string;
	/** Feature ids currently switched off (`src/features.ts`) — a feature is
	 * on unless its id appears here. */
	disabledFeatures: string[];
	/** Seed each new session's Scenes with the latest session's unplayed
	 * (unchecked) scenes (`sessions/scene-carryover.ts`). */
	carryScenes: boolean;
}

export const DEFAULT_SETTINGS: LazyCampaignPluginSettings = {
	campaignRoot: "Campaigns",
	disabledFeatures: [],
	carryScenes: false,
};
