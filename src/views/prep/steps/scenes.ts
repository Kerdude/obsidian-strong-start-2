import { Notice, setIcon, TFile } from "obsidian";
import { renderListSectionEditor } from "./list-section-editor";
import { sectionEditorCtxFrom } from "./section-editor-ctx";
import { latestSession, scenesToBringOver } from "../../../sessions/scene-carryover";
import type { StepContext } from "../step-context";

export function renderScenesStep(container: HTMLElement, ctx: StepContext): void {
	// The session just before this one — "Bring over unplayed" pulls from it
	// (scene-carryover.ts), the manual counterpart to the carryScenes setting.
	const prior = latestSession(
		ctx.sessions.filter((s) => s.path !== ctx.session.path && s.session < ctx.session.session)
	);

	const headerRow = container.createDiv({ cls: "strong-start-secret-section-header" });
	headerRow.createEl("h3", { text: "Outline potential scenes" });
	const bringBtn = prior
		? headerRow.createEl("button", {
				cls: "strong-start-secret-sync-button",
				attr: { type: "button", "aria-label": `Bring over unplayed scenes from session ${prior.session}` },
			})
		: null;
	if (bringBtn) {
		setIcon(bringBtn.createSpan(), "import");
		bringBtn.createSpan({ text: " Bring over unplayed" });
	}

	const editor = renderListSectionEditor(container, sectionEditorCtxFrom(ctx), ctx.body, {
		stepId: "scenes",
		heading: "Scenes",
		placeholder: "A scene…",
		hint: "3–8 is plenty — they'll go off-script anyway. Tick a scene once it's played; unticked ones can carry to the next session.",
		// Run mode toggles scenes done one-tap (`- [ ]`/`- [x]`, M6); prep can
		// too, so scenes played without Run mode can still be marked.
		taskAware: true,
		withDoneToggle: true,
		// Per-scene detail block (run-screen redesign): the indented text run
		// mode expands under the scene's chevron.
		withDetail: true,
	});

	if (bringBtn && prior) {
		ctx.registerDomEvent(bringBtn, "click", () => {
			void (async () => {
				const file = ctx.app.vault.getFileByPath(prior.path);
				if (!(file instanceof TFile)) {
					new Notice(`Couldn't find session ${prior.session}'s note.`);
					return;
				}
				const additions = scenesToBringOver(await ctx.app.vault.read(file), editor.rowTexts());
				if (additions.length === 0) {
					new Notice(`No unplayed scenes left to bring over from session ${prior.session}.`);
					return;
				}
				editor.addRows(additions);
				ctx.requestSoftRefresh();
				new Notice(
					`${additions.length} scene${additions.length === 1 ? "" : "s"} brought over from session ${prior.session}.`
				);
			})();
		});
	}
}
