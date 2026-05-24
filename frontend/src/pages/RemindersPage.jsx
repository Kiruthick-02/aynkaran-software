import React from 'react';
import { useApp } from '../context/AppContext';
import Reminders from '../modules/reminders/Reminders';

export default function RemindersPage() {
  const { reminders, setReminders } = useApp();

  return (
    <Reminders
      reminders={reminders}
      setReminders={setReminders}
    />
  );
}
