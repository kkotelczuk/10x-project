import React from "react";

import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { useAllergens } from "@/components/hooks/useAllergens";
import { useDiets } from "@/components/hooks/useDiets";
import { useProfile } from "@/components/hooks/useProfile";
import { ProfileErrorState } from "@/components/profile/ProfileErrorState";
import { ProfileLoadingState } from "@/components/profile/ProfileLoadingState";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileWizardCard } from "@/components/profile/ProfileWizardCard";
import type { OnboardingPrefill } from "@/types";

export function ProfileView() {
  const {
    profile,
    isLoading: isProfileLoading,
    isMissing,
    error: profileError,
    refetch: refetchProfile,
  } = useProfile();
  const { diets, isLoading: isDietsLoading, error: dietsError, refetch: refetchDiets } = useDiets();
  const { allergens, isLoading: isAllergensLoading, error: allergensError, refetch: refetchAllergens } = useAllergens();

  const isLoading = isProfileLoading || isDietsLoading || isAllergensLoading;
  const error = profileError || dietsError || allergensError;
  const displayName = profile?.display_name ?? null;
  const [selectedDietId, setSelectedDietId] = React.useState<string | null>(profile?.diet_id ?? null);
  const initialData = React.useMemo<OnboardingPrefill | undefined>(() => {
    if (!profile) return undefined;
    return {
      display_name: profile.display_name ?? null,
      diet_id: profile.diet_id ?? null,
      allergen_ids: profile.allergens ?? [],
      dislike_ids: profile.dislikes ?? [],
    };
  }, [profile]);
  const currentDietName = React.useMemo(() => {
    if (!selectedDietId) return null;
    return diets.find((diet) => diet.id === selectedDietId)?.name ?? null;
  }, [diets, selectedDietId]);
  const showDietChangeNotice = Boolean(profile && selectedDietId !== profile.diet_id);

  React.useEffect(() => {
    if (!profile) return;
    setSelectedDietId(profile.diet_id ?? null);
  }, [profile]);

  const handleRetry = React.useCallback(() => {
    refetchProfile();
    refetchDiets();
    refetchAllergens();
  }, [refetchProfile, refetchDiets, refetchAllergens]);

  if (isLoading) {
    return <ProfileLoadingState />;
  }

  if (error) {
    return <ProfileErrorState message={error} onRetry={handleRetry} />;
  }

  if (isMissing) {
    return (
      <ProfileErrorState
        title="Brak profilu użytkownika"
        message="Nie udało się odnaleźć profilu. Możesz utworzyć profil w kreatorze."
        onRetry={handleRetry}
        actionHref="/onboarding"
        actionLabel="Przejdź do onboardingu"
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProfileHeader
        displayName={displayName}
        currentDietName={currentDietName}
        showDietChangeNotice={showDietChangeNotice}
      />
      <div className="flex justify-end">
        <LogoutButton />
      </div>
      <ProfileWizardCard>
        <OnboardingWizard
          diets={diets}
          allergens={allergens}
          mode="edit"
          initialData={initialData}
          onDietChange={setSelectedDietId}
          onComplete={() => window.location.assign("/dashboard")}
        />
      </ProfileWizardCard>
    </div>
  );
}
