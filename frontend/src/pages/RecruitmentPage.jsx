import React from 'react';
import { useApp } from '../context/AppContext';
import Recruitment from '../modules/recruitment/Recruitment';

export default function RecruitmentPage() {
  const {
    candidates,
    addCandidate,
    updateCandidate,
    deleteCandidate
  } = useApp();

  return (
    <Recruitment
      candidates={candidates}
      addCandidate={addCandidate}
      updateCandidate={updateCandidate}
      deleteCandidate={deleteCandidate}
    />
  );
}
