import React from 'react';
import { useApp } from '../context/AppContext';
import PolicySales from '../modules/policy-sales/PolicySales';

export default function PolicySalesPage() {
  const {
    policies,
    addPolicy,
    updatePolicy,
    deletePolicy,
    customers
  } = useApp();

  return (
    <PolicySales
      policies={policies}
      addPolicy={addPolicy}
      updatePolicy={updatePolicy}
      deletePolicy={deletePolicy}
      customers={customers}
    />
  );
}
