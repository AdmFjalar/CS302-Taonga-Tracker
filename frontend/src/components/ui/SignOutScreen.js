import React from 'react';
import LoadingScreen from './LoadingScreen';

/**
 * SignOutScreen component - Shows a loading screen during the sign-out process
 * @component
 */
const SignOutScreen = () => {
  return (
    <LoadingScreen
      message="Signing out... Please wait while we securely sign you out"
      overlay={true}
      size="large"
    />
  );
};

export default SignOutScreen;
