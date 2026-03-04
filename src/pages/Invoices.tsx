import AppLayout from '../components/layout/AppLayout';
import { Card } from '../components/ui/card';

export default function Invoices() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Generate invoices and track payments for won deals.
        </p>
        <Card className="p-8 text-center">
          <p className="text-gray-500">Invoices module coming soon</p>
        </Card>
      </div>
    </AppLayout>
  );
}
