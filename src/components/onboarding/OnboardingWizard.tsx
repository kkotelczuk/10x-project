import React, { useState } from "react";
import { z } from "zod";
import type { DietDTO, AllergenDTO, UpsertProfileCommand } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Step1BasicInfo } from "./steps/Step1BasicInfo";
import { Step2DietSelection } from "./steps/Step2DietSelection";
import { Step3Allergens } from "./steps/Step3Allergens";
import { Step4Dislikes } from "./steps/Step4Dislikes";
import { toast } from "sonner";

// Define the schema for the onboarding form
const onboardingSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
  accept_terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
  diet_id: z.string().nullable(),
  allergen_ids: z.array(z.string()),
  dislike_ids: z.array(z.string()),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingWizardProps {
  diets: DietDTO[];
  allergens: AllergenDTO[];
}

export default function OnboardingWizard({ diets, allergens }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    display_name: "",
    accept_terms: false,
    diet_id: null,
    allergen_ids: [],
    dislike_ids: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const updateFormData = (data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Clear errors for fields being updated
    const newErrors = { ...errors };
    Object.keys(data).forEach((key) => {
      delete newErrors[key as keyof OnboardingFormData];
    });
    setErrors(newErrors);
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof OnboardingFormData, string>> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.display_name || formData.display_name.length < 2) {
        newErrors.display_name = "Name must be at least 2 characters";
        isValid = false;
      }
      if (!formData.accept_terms) {
        newErrors.accept_terms = "You must accept the terms";
        isValid = false;
      }
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
        display_name: formData.display_name || null,
        accept_terms: formData.accept_terms,
        diet_id: formData.diet_id,
        allergen_ids: formData.allergen_ids,
        dislike_ids: formData.dislike_ids,
      };

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

      toast.success("Profile updated successfully!");

      // Redirect to dashboard or next page
      // window.location.href = "/dashboard";
      // For now, maybe just show success state or reload
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
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
              />
            )}
            {step === 2 && (
              <Step2DietSelection diets={diets} selectedDietId={formData.diet_id} onUpdate={updateFormData} />
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
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : step === 4 ? "Complete Profile" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
