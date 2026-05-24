import React from 'react';
import { useApp } from '../context/AppContext';
import Recruitment from '../modules/recruitment/Recruitment';

export default function RecruitmentPage() {
  const { candidates, setCandidates } = useApp();

  return (
    <Recruitment
      candidates={candidates}
      setCandidates={setCandidates}
    />
  );
}
