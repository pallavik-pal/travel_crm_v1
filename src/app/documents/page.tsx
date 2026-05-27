'use client';

import React, { type FormEvent, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Download, Trash2, Upload } from 'lucide-react';
import { formatDate } from '@/lib/constants';
import { useRecords } from '@/lib/use-records';

const mockDocuments = [
  {
    id: 1,
    travelerName: 'Rajesh Kumar',
    type: 'passport',
    fileName: 'rajesh_passport.pdf',
    uploadedAt: '2026-04-20',
    expiryDate: '2030-06-15',
    status: 'verified',
    tour: 'Thailand May Batch',
  },
  {
    id: 2,
    travelerName: 'Priya Singh',
    type: 'aadhaar',
    fileName: 'priya_aadhaar.pdf',
    uploadedAt: '2026-04-22',
    expiryDate: null,
    status: 'pending',
    tour: 'Thailand May Batch',
  },
  {
    id: 3,
    travelerName: 'Amit Patel',
    type: 'passport',
    fileName: 'amit_passport.pdf',
    uploadedAt: '2026-04-18',
    expiryDate: '2031-09-10',
    status: 'verified',
    tour: 'Kashmir June Batch',
  },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useRecords('/api/documents', mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleUploadDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file');
    const payload = {
      ...Object.fromEntries(formData.entries()),
      fileName: file instanceof File ? file.name : '',
    };

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to upload document');
      }

      setDocuments((currentDocuments) => [data, ...currentDocuments]);
      form.reset();
      setShowUploadForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to upload document');
    } finally {
      setIsSaving(false);
    }
  };

  let filteredDocuments = documents.filter(
    (doc) =>
      doc.travelerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterType) {
    filteredDocuments = filteredDocuments.filter(
      (doc) => doc.type === filterType
    );
  }

  if (filterStatus) {
    filteredDocuments = filteredDocuments.filter(
      (doc) => doc.status === filterStatus
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      passport: 'bg-blue-100 text-blue-800',
      aadhaar: 'bg-orange-100 text-orange-800',
      pan: 'bg-green-100 text-green-800',
      visa: 'bg-purple-100 text-purple-800',
      ticket: 'bg-pink-100 text-pink-800',
    };

    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-gray-600">
              Manage traveler documents and uploads
            </p>
          </div>

          <Button onClick={() => setShowUploadForm(!showUploadForm)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {showUploadForm && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadDocument} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Booking Code</Label>
                  <Input name="bookingCode" placeholder="BK-202505-ABC123" required />
                </div>

                <div>
                  <Label>Document Type</Label>
                  <select name="type" className="border rounded px-3 h-10 w-full" required>
                    <option value="">Select type</option>
                    <option value="aadhaar">Aadhaar</option>
                    <option value="pan">PAN</option>
                    <option value="passport">Passport</option>
                    <option value="visa">Visa</option>
                    <option value="ticket">Ticket</option>
                  </select>
                </div>

                <div>
                  <Label>Expiry Date</Label>
                  <Input name="expiryDate" type="date" />
                </div>

                <div>
                  <Label>Status</Label>
                  <select name="status" className="border rounded px-3 h-10 w-full">
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <Label>Upload File</Label>
                  <Input name="file" type="file" required />
                </div>

                {formError && <p className="md:col-span-2 text-sm text-red-600">{formError}</p>}

                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" className="flex-1" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Document'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p>Total Documents</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p>Verified</p>
              <p className="text-2xl font-bold text-green-600">
                {documents.filter((d) => d.status === 'verified').length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p>Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {documents.filter((d) => d.status === 'pending').length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <p>Expired</p>
              <p className="text-2xl font-bold text-red-600">
                {documents.filter((d) => d.status === 'expired').length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded px-3"
          >
            <option value="">All Types</option>
            <option value="passport">Passport</option>
            <option value="aadhaar">Aadhaar</option>
            <option value="pan">PAN</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3"
          >
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              {filteredDocuments.length} document
              {filteredDocuments.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Traveler</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.travelerName}</TableCell>
                    <TableCell>{doc.tour}</TableCell>

                    <TableCell>
                      <Badge className={getDocumentTypeColor(doc.type)}>
                        {doc.type}
                      </Badge>
                    </TableCell>

                    <TableCell>{doc.fileName}</TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>

                    <TableCell>
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye size={16} />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download size={16} />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
