import React from 'react';
import { useApp } from '../context/AppContext';
import Reminders from '../modules/reminders/Reminders';

export default function RemindersPage() {
  const {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    triggerAutomatedReminders,
    userRole
  } = useApp();

  return (
    <Reminders
      reminders={reminders}
      addReminder={addReminder}
      updateReminder={updateReminder}
      deleteReminder={deleteReminder}
      triggerAutomatedReminders={triggerAutomatedReminders}
      userRole={userRole}
    />
  );
}
