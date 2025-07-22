import React from 'react';
import LoadingScreen from './LoadingScreen';

/**
 * Sign out screen component that displays during the logout process.
 *
 * @returns {JSX.Element} Sign out loading screen
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
