import React from 'react';

import ResidentHome from './home';

type ResidentProps = {
  onLogout: () => void;
};

export default function Resident({ onLogout }: ResidentProps) {
  return <ResidentHome onLogout={onLogout} />;
}
