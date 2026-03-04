import AppLayout from '../components/layout/AppLayout';
import { Card } from '../components/ui/card';

export default function Proposals() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Create and manage professional proposals & SOWs for your clients.
        </p>
        <Card className="p-8 text-center">
          <p className="text-gray-500">Proposals module coming soon</p>
        </Card>
      </div>
    </AppLayout>
  );
}
