//frontend/src/pages/CustomersPage.jsx

import React from 'react';
import { useApp } from '../context/AppContext';
import Customers from '../modules/customers/Customers';

<<<<<<< HEAD
export default function CustomersPage({ initialEnquiry = null }) {
  const { customers, updateCustomer, deleteCustomer, policies } = useApp();
=======
export default function CustomersPage() {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    policies
  } = useApp();
>>>>>>> d96c25bb403988716178a2b21910505a45607a70

  return (
    <Customers
      customers={customers}
<<<<<<< HEAD
      onUpdateCustomer={updateCustomer}
=======
      addCustomer={addCustomer}
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      updateCustomer={updateCustomer}
      deleteCustomer={deleteCustomer}
      policies={policies}
      initialEnquiry={initialEnquiry}
      onShowNotification={(msg) => console.log('[notify]', msg)}
    />
  );
}