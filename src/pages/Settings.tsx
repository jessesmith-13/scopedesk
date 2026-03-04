import AppLayout from '../components/layout/AppLayout';
import { Card } from '../components/ui/card';

export default function Settings() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Configure your app preferences, integrations, and account settings.
        </p>
        <Card className="p-8 text-center">
          <p className="text-gray-500">Settings module coming soon</p>
        </Card>
      </div>
    </AppLayout>
  );
}
