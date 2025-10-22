import React from 'react';
import Joyride, { STATUS } from 'react-joyride';

const GuidedTour = ({ run, steps, onTourEnd }) => {
  const handleCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onTourEnd();
    }
  };

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      showProgress
      showSkipButton
      callback={handleCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#2563eb',
          textColor: '#334155',
          arrowColor: '#fff',
        },
        buttonNext: {
          backgroundColor: '#2563eb',
        },
        buttonBack: {
          color: '#64748b',
        },
        tooltip: {
          borderRadius: '0.75rem',
          padding: '1rem 1.5rem',
        },
      }}
      locale={{
        back: 'Anterior',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar',
      }}
    />
  );
};

export default GuidedTour;