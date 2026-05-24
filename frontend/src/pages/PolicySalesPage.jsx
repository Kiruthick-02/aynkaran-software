import React from 'react';
import { useApp } from '../context/AppContext';
import PolicySales from '../modules/policy-sales/PolicySales';

export default function PolicySalesPage() {
  const { policies, setPolicies, customers } = useApp();

  return (
    <PolicySales
      policies={policies}
      setPolicies={setPolicies}
      customers={customers}
    />
  );
}
