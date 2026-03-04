import AppLayout from '../components/layout/AppLayout';
import { Card } from '@/components/ui/card';

export default function Contacts() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Manage your network of business contacts and relationships.
        </p>
        <Card className="p-8 text-center">
          <p className="text-gray-500">Contacts module coming soon</p>
        </Card>
      </div>
    </AppLayout>
  );
}
