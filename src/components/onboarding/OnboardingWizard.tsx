import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  DietDTO,
  AllergenDTO,
  OnboardingMode,
  OnboardingPrefill,
  ProfileDTO,
  UpsertProfileCommand,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Step1BasicInfo } from "./steps/Step1BasicInfo";
import { Step2DietSelection } from "./steps/Step2DietSelection";
import { Step3Allergens } from "./steps/Step3Allergens";
import { Step4Dislikes } from "./steps/Step4Dislikes";
import { toast } from "sonner";
import { setMockUser } from "@/components/hooks/authStorage";
import { logger } from "@/lib/logger";

interface OnboardingFormData {
  display_name?: string;
  accept_terms?: boolean;
  diet_id: string | null;
  allergen_ids: string[];
  dislike_ids: string[];
}

interface OnboardingWizardProps {
  diets: DietDTO[];
  allergens: AllergenDTO[];
  mode?: OnboardingMode;
  initialData?: OnboardingPrefill;
  onComplete?: (profile: ProfileDTO) => void;
  onCancel?: () => void;
  onDietChange?: (dietId: string | null) => void;
}

export default function OnboardingWizard({
  diets,
  allergens,
  mode = "create",
  initialData,
  onComplete,
  onCancel,
  onDietChange,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    display_name: initialData?.display_name ?? "",
    accept_terms: false,
    diet_id: initialData?.diet_id ?? null,
    allergen_ids: initialData?.allergen_ids ?? [],
    dislike_ids: initialData?.dislike_ids ?? [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDietSelection, setHasDietSelection] = useState(Boolean(initialData));
  const isInitialized = useRef(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    if (!initialData || isInitialized.current) return;
    setFormData((prev) => ({
      ...prev,
      display_name: initialData.display_name ?? "",
      diet_id: initialData.diet_id ?? null,
      allergen_ids: initialData.allergen_ids ?? [],
      dislike_ids: initialData.dislike_ids ?? [],
    }));
    setHasDietSelection(true);
    isInitialized.current = true;
  }, [initialData]);

  const isCreateMode = mode === "create";

  const dietError = useMemo(() => {
    if (step !== 2) return undefined;
    if (hasDietSelection) return undefined;
    return "Please choose a diet or select the no diet option.";
  }, [hasDietSelection, step]);

  const updateFormData = (data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Clear errors for fields being updated
    setErrors((prev) => {
      const nextErrors = { ...prev };
      Object.keys(data).forEach((key) => {
        nextErrors[key as keyof OnboardingFormData] = undefined;
      });
      return nextErrors;
    });
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof OnboardingFormData, string>> = {};
    let isValid = true;

    if (currentStep === 1) {
      const trimmedName = (formData.display_name ?? "").trim();
      const shouldValidateName = isCreateMode || trimmedName.length > 0;
      if (shouldValidateName && trimmedName.length < 2) {
        newErrors.display_name = "Name must be at least 2 characters";
        isValid = false;
      }
      if (isCreateMode && !formData.accept_terms) {
        newErrors.accept_terms = "You must accept the terms";
        isValid = false;
      }
    }

    if (currentStep === 2 && !hasDietSelection) {
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === totalSteps) {
        handleComplete();
      } else {
        setStep((prev) => Math.min(prev + 1, totalSteps));
      }
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Prepare the payload matching UpsertProfileCommand
      const payload: UpsertProfileCommand = {
        display_name: formData.display_name ? formData.display_name.trim() || null : null,
        diet_id: formData.diet_id ?? null,
        allergen_ids: formData.allergen_ids,
        dislike_ids: formData.dislike_ids,
      };
      if (isCreateMode) {
        payload.accept_terms = Boolean(formData.accept_terms);
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const profile = (await response.json()) as ProfileDTO;
      toast.success("Profile updated successfully!");
      if (typeof window !== "undefined") {
        setMockUser({ displayName: profile.display_name ?? "Użytkownik" }, true);
      }
      onComplete?.(profile);
      if (onComplete) return;

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      logger.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Progress value={progress} className="w-full" />

      <Card>
        <CardContent className="p-6">
          <div className="min-h-[300px]">
            {step === 1 && (
              <Step1BasicInfo
                displayName={formData.display_name || ""}
                acceptTerms={formData.accept_terms}
                onUpdate={updateFormData}
                errors={errors}
                showTerms={isCreateMode}
              />
            )}
            {step === 2 && (
              <Step2DietSelection
                diets={diets}
                selectedDietId={formData.diet_id}
                onUpdate={(data) => {
                  onDietChange?.(data.diet_id ?? null);
                  setHasDietSelection(true);
                  updateFormData(data);
                }}
                error={dietError}
              />
            )}
            {step === 3 && (
              <Step3Allergens
                allergens={allergens}
                selectedAllergenIds={formData.allergen_ids}
                onUpdate={updateFormData}
              />
            )}
            {step === 4 && <Step4Dislikes dislikeIds={formData.dislike_ids} onUpdate={updateFormData} />}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button variant="outline" onClick={handleBack} disabled={step === 1 || isSubmitting}>
              Back
            </Button>
            <div className="flex gap-2">
              {onCancel ? (
                <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              ) : null}
              <Button onClick={handleNext} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : step === 4 ? "Complete Profile" : "Next"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
