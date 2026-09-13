<<<<<<< SEARCH
  const dailyAlignment = useMemo(() => getDailyAlignment(userProfile?.uid || 'guest'), [userProfile?.uid]);
=======
  const dailyAlignment = useMemo(
    () => getDailyAlignment(userProfile?.uid || 'guest', undefined, userProfile?.onboardingPreferences),
    [userProfile?.uid, userProfile?.onboardingPreferences]
  );
>>>>>>> REPLACE