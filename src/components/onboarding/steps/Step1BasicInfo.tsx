import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Step1BasicInfoProps {
  displayName: string;
  acceptTerms: boolean;
  onUpdate: (data: { display_name?: string; accept_terms?: boolean }) => void;
  errors?: { display_name?: string; accept_terms?: string };
  showTerms?: boolean;
}

export function Step1BasicInfo({ displayName, acceptTerms, onUpdate, errors, showTerms = true }: Step1BasicInfoProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Let&apos;s get started</CardTitle>
        <CardDescription>Please provide your details to personalize your experience.</CardDescription>
      </CardHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name</Label>
          <Input
            id="display-name"
            placeholder="How should we call you?"
            value={displayName}
            onChange={(e) => onUpdate({ display_name: e.target.value })}
            className={errors?.display_name ? "border-red-500" : ""}
          />
          {errors?.display_name && <p className="text-sm text-red-500">{errors.display_name}</p>}
        </div>

        {showTerms ? (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => onUpdate({ accept_terms: checked === true })}
                className={errors?.accept_terms ? "border-red-500" : ""}
              />
              <Label
                htmlFor="terms"
                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${errors?.accept_terms ? "text-red-500" : ""}`}
              >
                I accept the terms and conditions
              </Label>
            </div>
            {errors?.accept_terms && <p className="text-sm text-red-500">{errors.accept_terms}</p>}
          </>
        ) : null}
      </div>
    </div>
  );
}
