import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LogOut, User } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  // Load user data on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email,
          name: data.user.user_metadata?.name,
        });
      }
    });
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Configure your app preferences, integrations, and account settings.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Manage your account and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="space-y-2">
                {user.name && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-sm text-gray-600">{user.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {loading ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-8 text-center">
          <p className="text-gray-500">Additional settings modules coming soon</p>
        </Card>
      </div>
    </AppLayout>
  );
}