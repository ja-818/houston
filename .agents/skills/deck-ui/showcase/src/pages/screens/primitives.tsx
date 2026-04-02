import { ButtonPage } from "../core/button";
import { BadgePage } from "../core/badge";
import { CardPage } from "../core/card";
import { InputPage } from "../core/input";
import { DialogPage } from "../core/dialog";
import { EmptyPage } from "../core/empty";
import { SeparatorPage } from "../core/separator";
import { StepperPage } from "../core/stepper";

export function PrimitivesScreen() {
  return (
    <div className="space-y-16">
      <ButtonPage />
      <hr className="border-border" />
      <BadgePage />
      <hr className="border-border" />
      <CardPage />
      <hr className="border-border" />
      <InputPage />
      <hr className="border-border" />
      <DialogPage />
      <hr className="border-border" />
      <EmptyPage />
      <hr className="border-border" />
      <SeparatorPage />
      <hr className="border-border" />
      <StepperPage />
    </div>
  );
}
