//frontend/src/pages/PolicySalesPage.jsx

import React from 'react';
import { useApp } from '../context/AppContext';
import PolicySales from '../modules/policy-sales/CompaniesPolicies';

export default function PolicySalesPage() {
  const {
    policies,
    addPolicy,
    updatePolicy,
    deletePolicy,
    customers,
    addCustomer,
    updateCustomer,
  } = useApp();

  // Toast helper – use your global toast if you have one
  const onShowNotification = (msg) => {
    if (typeof window !== 'undefined') {
      // optional: integrate with a toast system
      console.log('[notify]', msg);
    }
    // If AppContext has setNotification / showToast, call it here:
    // showToast?.(msg);
  };

  return (
    <PolicySales
      policies={policies}
      addPolicy={addPolicy}
      updatePolicy={updatePolicy}
      deletePolicy={deletePolicy}
      customers={customers}
      policyHolders={customers}
      onAddCustomer={addCustomer}
      onUpdateCustomer={updateCustomer}
      onShowNotification={onShowNotification}
    />
  );
}