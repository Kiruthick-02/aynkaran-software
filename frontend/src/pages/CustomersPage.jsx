import React from 'react';
import { useApp } from '../context/AppContext';
import Customers from '../modules/customers/Customers';

export default function CustomersPage() {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    policies
  } = useApp();

  return (
    <Customers
      customers={customers}
      addCustomer={addCustomer}
      updateCustomer={updateCustomer}
      deleteCustomer={deleteCustomer}
      policies={policies}
    />
  );
}
