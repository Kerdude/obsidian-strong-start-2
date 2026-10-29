import { describe, expect, it } from "vitest";
import { carryScenesContent, latestSession, unplayedScenes } from "../src/sessions/scene-carryover";
import type { SessionModel } from "../src/sessions/types";

function session(overrides: Partial<SessionModel> & Pick<SessionModel, "path" | "session">): SessionModel {
	return {
		campaign: "[[Test]]",
		status: "prep",
		stepsDone: [],
		secrets: [],
		npcs: [],
		locations: [],
		monsters: [],
		...overrides,
	};
}

const body = (scenes: string) => `## Strong start\n\nAmbush!\n\n## Scenes\n\n${scenes}\n\n## Rewards\n\n- [x] Not a scene\n`;

describe("unplayedScenes", () => {
	it("keeps unchecked scenes and drops checked ones", () => {
		const rows = unplayedScenes(body("- [x] Played\n- [ ] Skipped\n- [X] Also played\n- [ ] Next time"));
		expect(rows.map((r) => r.text)).toEqual(["Skipped", "Next time"]);
	});

	it("treats plain bullets as unplayed", () => {
		expect(unplayedScenes(body("- Hand-written scene")).map((r) => r.text)).toEqual(["Hand-written scene"]);
	});

	it("carries a scene's detail block with it", () => {
		const rows = unplayedScenes(body("- [ ] The bridge\n    Troll wants a toll\n- [x] Done"));
		expect(rows).toEqual([{ text: "The bridge", done: false, detail: "Troll wants a toll" }]);
	});

	it("reads only the Scenes section", () => {
		expect(unplayedScenes(body(""))).toEqual([]);
	});
});

describe("carryScenesContent", () => {
	it("renders carried rows as fresh unchecked tasks", () => {
		expect(carryScenesContent(body("- [x] Played\n- [ ] The bridge\n    Troll wants a toll"))).toBe(
			"- [ ] The bridge\n    Troll wants a toll"
		);
	});

	it("is empty when every scene was played", () => {
		expect(carryScenesContent(body("- [x] One\n- [x] Two"))).toBe("");
	});
});

describe("latestSession", () => {
	it("picks the highest session number regardless of order", () => {
		const s1 = session({ path: "s1.md", session: 1 });
		const s3 = session({ path: "s3.md", session: 3 });
		const s2 = session({ path: "s2.md", session: 2 });
		expect(latestSession([s1, s3, s2])?.path).toBe("s3.md");
	});

	it("breaks number ties by date, then path", () => {
		const a = session({ path: "a.md", session: 2, date: "2026-01-01" });
		const b = session({ path: "b.md", session: 2, date: "2026-02-01" });
		expect(latestSession([b, a])?.path).toBe("b.md");
		const c = session({ path: "c.md", session: 2, date: "2026-02-01" });
		expect(latestSession([c, b])?.path).toBe("c.md");
	});

	it("is null with no sessions", () => {
		expect(latestSession([])).toBeNull();
	});
});
