import React from 'react';
import { useApp } from '../context/AppContext';
import Customers from '../modules/customers/Customers';

export default function CustomersPage() {
  const { customers, setCustomers, policies } = useApp();

  return (
    <Customers
      customers={customers}
      setCustomers={setCustomers}
      policies={policies}
    />
  );
}
