'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRecords } from '@/lib/use-records';
import { type FormEvent, useState } from 'react';

const fallbackSettings = {
  settings: {
    organizationName: 'Travel Adventures Inc.',
    defaultCurrency: 'INR',
    timezone: 'IST',
    emailNotifications: true,
    smsAlerts: true,
    dailySummaryReport: false,
  },
  user: {
    email: 'admin@example.com',
    role: 'admin',
  },
};

export default function SettingsPage() {
  const [{ settings, user }, setSettingsRecord] = useRecords('/api/settings', fallbackSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    const formData = new FormData(event.currentTarget);
    const formKind = formData.get('formKind');
    const payload = {
      organizationName: formData.get('organizationName'),
      defaultCurrency: formData.get('defaultCurrency'),
      timezone: formData.get('timezone'),
      emailNotifications:
        formKind === 'preferences'
          ? formData.has('emailNotifications')
          : settings?.emailNotifications,
      smsAlerts: formKind === 'preferences' ? formData.has('smsAlerts') : settings?.smsAlerts,
      dailySummaryReport:
        formKind === 'preferences'
          ? formData.has('dailySummaryReport')
          : settings?.dailySummaryReport,
    };

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to save settings');
      }

      setSettingsRecord(data);
      setSaveMessage('Settings saved');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Unable to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your CRM preferences and configurations</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic application settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-6">
            <input type="hidden" name="formKind" value="general" />
            <div>
              <Label>Organization Name</Label>
              <Input
                name="organizationName"
                placeholder="Your organization name"
                defaultValue={settings?.organizationName ?? ''}
              />
            </div>
            <div>
              <Label>Default Currency</Label>
              <Input name="defaultCurrency" placeholder="INR" defaultValue={settings?.defaultCurrency ?? 'INR'} />
            </div>
            <div>
              <Label>Timezone</Label>
              <Input name="timezone" placeholder="IST" defaultValue={settings?.timezone ?? 'IST'} />
            </div>
            {saveMessage && <p className="text-sm text-gray-600">{saveMessage}</p>}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <input type="hidden" name="formKind" value="preferences" />
              <input
                type="hidden"
                name="organizationName"
                value={settings?.organizationName ?? ''}
              />
              <input
                type="hidden"
                name="defaultCurrency"
                value={settings?.defaultCurrency ?? 'INR'}
              />
              <input type="hidden" name="timezone" value={settings?.timezone ?? 'IST'} />
            <div>
              <Label>Notifications</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    name="emailNotifications"
                    type="checkbox"
                    defaultChecked={settings?.emailNotifications ?? true}
                    className="mr-2"
                  />
                  <span>Email notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    name="smsAlerts"
                    type="checkbox"
                    defaultChecked={settings?.smsAlerts ?? true}
                    className="mr-2"
                  />
                  <span>SMS alerts for payments</span>
                </label>
                <label className="flex items-center">
                  <input
                    name="dailySummaryReport"
                    type="checkbox"
                    defaultChecked={settings?.dailySummaryReport ?? false}
                    className="mr-2"
                  />
                  <span>Daily summary report</span>
                </label>
              </div>
            </div>
            {saveMessage && <p className="text-sm text-gray-600">{saveMessage}</p>}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Email Address</Label>
              <Input placeholder="admin@example.com" value={user?.email ?? ''} disabled />
            </div>
            <div>
              <Label>Role</Label>
              <Input placeholder="Admin" value={user?.role ?? ''} disabled />
            </div>
            <Button variant="outline">Change Password</Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
