import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  Send, 
  Inbox, 
  Clock, 
  FileText, 
  Plus, 
  Paperclip, 
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'scheduled';
  leadName?: string;
}

const mockEmails: Email[] = [
  {
    id: '1',
    from: 'sarah.miller@greenwoodcafe.com',
    to: 'me@freelance.com',
    subject: 'Re: Website Redesign Proposal',
    preview: 'Thanks for reaching out! I\'d love to discuss this further...',
    date: '2026-03-03T10:30:00',
    read: false,
    folder: 'inbox',
    leadName: 'Greenwood Cafe',
  },
  {
    id: '2',
    from: 'me@freelance.com',
    to: 'mike.chen@capitolhillsalon.com',
    subject: 'Quick Website Audit Results',
    preview: 'Hi Mike, I wanted to share some findings from my audit of your website...',
    date: '2026-03-02T14:20:00',
    read: true,
    folder: 'sent',
    leadName: 'Capitol Hill Salon',
  },
  {
    id: '3',
    from: 'me@freelance.com',
    to: 'dr.lee@ballarddental.com',
    subject: '[DRAFT] Follow-up: Meeting Discussion',
    preview: 'Hi Dr. Lee, It was great meeting with you yesterday...',
    date: '2026-03-03T09:00:00',
    read: true,
    folder: 'drafts',
  },
  {
    id: '4',
    from: 'me@freelance.com',
    to: 'tom@fremontfitness.com',
    subject: 'Your Custom Web Development Proposal',
    preview: 'Hi Tom, As discussed, here\'s a detailed proposal for your fitness center...',
    date: '2026-03-05T08:00:00',
    read: true,
    folder: 'scheduled',
    leadName: 'Fremont Fitness',
  },
];

const emailFolders = [
  { id: 'inbox' as const, label: 'Inbox', icon: Inbox, count: 3 },
  { id: 'sent' as const, label: 'Sent', icon: Send, count: 0 },
  { id: 'drafts' as const, label: 'Drafts', icon: FileText, count: 1 },
  { id: 'scheduled' as const, label: 'Scheduled', icon: Clock, count: 1 },
];

const emailTemplates = [
  { id: '1', name: 'Cold Outreach', category: 'Initial Contact' },
  { id: '2', name: 'Follow-up #1', category: 'Follow-up' },
  { id: '3', name: 'Proposal Follow-up', category: 'Follow-up' },
  { id: '4', name: 'Meeting Request', category: 'Meeting' },
];

export default function EmailCenter() {
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'sent' | 'drafts' | 'scheduled'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(mockEmails[0]);
  const [composeOpen, setComposeOpen] = useState(false);

  const folderEmails = mockEmails.filter((email) => email.folder === selectedFolder);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Open Rate</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">68%</div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Response Rate</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">24%</div>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Sent This Week</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">12</div>
              </div>
              <Send className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Avg. Response Time</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">2.4d</div>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Email Interface */}
        <div className="grid grid-cols-12 gap-4 min-h-[600px]">
          {/* Left: Folders */}
          <div className="col-span-3">
            <Card className="p-4">
              <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full mb-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Compose
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Compose Email</DialogTitle>
                  </DialogHeader>
                  <ComposeForm onClose={() => setComposeOpen(false)} />
                </DialogContent>
              </Dialog>

              <nav className="space-y-1">
                {emailFolders.map((folder) => {
                  const Icon = folder.icon;
                  const isActive = selectedFolder === folder.id;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{folder.label}</span>
                      </div>
                      {folder.count > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {folder.count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 mb-2">QUICK TEMPLATES</h4>
                <div className="space-y-1">
                  {emailTemplates.slice(0, 3).map((template) => (
                    <button
                      key={template.id}
                      className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Center: Email List */}
          <div className="col-span-4">
            <Card className="p-0 h-full">
              <div className="border-b border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 capitalize">{selectedFolder}</h3>
              </div>
              <div className="divide-y divide-gray-200 overflow-y-auto max-h-[600px]">
                {folderEmails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-sm ${!email.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                        {email.folder === 'inbox' ? email.from.split('@')[0] : email.to.split('@')[0]}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(email.date), 'MMM d')}
                      </span>
                    </div>
                    {email.leadName && (
                      <Badge variant="outline" className="text-xs mb-1">
                        {email.leadName}
                      </Badge>
                    )}
                    <div className="text-sm text-gray-900 mb-1 truncate">{email.subject}</div>
                    <div className="text-xs text-gray-500 truncate">{email.preview}</div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Email Preview */}
          <div className="col-span-5">
            <Card className="p-6 h-full">
              {selectedEmail ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">{selectedEmail.from.split('@')[0]}</span>
                      <span className="text-gray-400">→</span>
                      <span>{selectedEmail.to.split('@')[0]}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(selectedEmail.date), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>

                  {selectedEmail.leadName && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-900">
                        Linked to: <span className="font-medium">{selectedEmail.leadName}</span>
                      </span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEmail.preview}</p>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button size="sm">
                      <Send className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button size="sm" variant="outline">
                      Forward
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select an email to view
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ComposeForm({ onClose }: { onClose: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState('');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template">Email Template (Optional)</Label>
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger id="template">
            <SelectValue placeholder="Select a template or write from scratch" />
          </SelectTrigger>
          <SelectContent>
            {emailTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} <span className="text-xs text-gray-500">({template.category})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="to">To</Label>
        <Input id="to" placeholder="recipient@example.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" placeholder="Email subject" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" rows={10} placeholder="Type your message..." />
        <div className="text-xs text-gray-500">
          Use variables: {'{business_name}'}, {'{contact_name}'}, {'{audit_issue}'}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Attachments</Label>
        <Button variant="outline" size="sm">
          <Paperclip className="w-4 h-4 mr-2" />
          Attach File
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="schedule">Schedule Send (Optional)</Label>
        <Input id="schedule" type="datetime-local" />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Save Draft
        </Button>
        <Button onClick={onClose}>
          <Send className="w-4 h-4 mr-2" />
          Send Now
        </Button>
      </div>
    </div>
  );
}