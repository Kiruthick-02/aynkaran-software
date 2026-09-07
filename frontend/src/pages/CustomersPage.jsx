//frontend/src/pages/CustomersPage.jsx

import React from 'react';
import { useApp } from '../context/AppContext';
import Customers from '../modules/customers/Customers';

export default function CustomersPage({ initialEnquiry = null }) {
  const { customers, updateCustomer, deleteCustomer, policies } = useApp();

  return (
    <Customers
      customers={customers}
      onUpdateCustomer={updateCustomer}
      updateCustomer={updateCustomer}
      deleteCustomer={deleteCustomer}
      policies={policies}
      initialEnquiry={initialEnquiry}
      onShowNotification={(msg) => console.log('[notify]', msg)}
    />
  );
}