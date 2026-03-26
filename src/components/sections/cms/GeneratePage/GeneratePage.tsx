"use client";

import { WizardProvider } from "@/components/sections/cms/WizardProvider/WizardProvider";
import DemoWizard from "@/components/sections/cms/DemoWizard/DemoWizard";

export default function GeneratePage() {
  return (
    <WizardProvider>
      <DemoWizard />
    </WizardProvider>
  );
}
