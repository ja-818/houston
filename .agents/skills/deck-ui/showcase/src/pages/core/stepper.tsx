import { useState } from "react";
import { Stepper } from "@deck-ui/core";
import { Section } from "../../components/section";

const PLANNING_STEPS = [
  { id: "office-hours", label: "Office Hours" },
  { id: "ceo-review", label: "CEO Review" },
  { id: "eng-review", label: "Eng Review" },
  { id: "design-review", label: "Design Review" },
];

const STEP_IDS = PLANNING_STEPS.map((s) => s.id);

export function StepperPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeStep = activeIndex < STEP_IDS.length ? STEP_IDS[activeIndex] : null;
  const completedSteps = STEP_IDS.slice(0, activeIndex);

  function advance() {
    setActiveIndex((i) => Math.min(i + 1, STEP_IDS.length));
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold mb-1">Stepper</h1>
        <p className="inline-block text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded mb-3">
          @deck-ui/core
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          A horizontal progress stepper for sequential workflows. Shows
          active, completed, and pending states with connecting lines.
        </p>
      </div>

      <Section title="Interactive" description="Click the step circles or the advance button to progress.">
        <div className="space-y-4">
          <Stepper
            steps={PLANNING_STEPS}
            activeStep={activeStep}
            completedSteps={completedSteps}
            onStepClick={(id) => setActiveIndex(STEP_IDS.indexOf(id))}
          />
          <div className="flex gap-2">
            <button
              onClick={advance}
              className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground"
            >
              Advance
            </button>
            <button
              onClick={() => setActiveIndex(0)}
              className="text-xs px-3 py-1 rounded border border-border"
            >
              Reset
            </button>
          </div>
        </div>
      </Section>

      <Section title="Partially completed" description="Steps 1-2 done, step 3 active.">
        <Stepper
          steps={PLANNING_STEPS}
          activeStep="eng-review"
          completedSteps={["office-hours", "ceo-review"]}
        />
      </Section>

      <Section title="All completed" description="Every step marked as done.">
        <Stepper
          steps={PLANNING_STEPS}
          activeStep={null}
          completedSteps={STEP_IDS}
        />
      </Section>
    </div>
  );
}
