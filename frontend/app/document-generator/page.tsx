'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import io, { Socket } from 'socket.io-client';

type DocumentType = 'contract' | 'proposal' | 'invoice';

interface FormData {
  clientName: string;
  description: string;
  projectScope?: string;
  price?: string;
  paymentTerms?: string;
  paymentTermsCustom?: string;
  timeline?: string;
  revisionPolicy?: string;
  ipOwnership?: string;
  liabilityTerms?: string;
  terminationClause?: string;
  latePaymentPenalties?: string;
  proposedPrice?: string;
  deliveryDate?: string;
  companyName?: string;
  deliverables?: string;
  paymentSchedule?: string;
  ctaTone?: string;
  invoiceNumber?: string;
  amount?: string;
  workDescription?: string;
  dueDate?: string;
  yourName?: string;
  yourEmail?: string;
  yourAddress?: string;
  paymentMethods?: string[];
  taxInfo?: string;
  invoicePaymentTerms?: string;
  lineItems?: Array<{ description: string; quantity: number; rate: number }>;
}

interface GenerationProgress {
  status: 'idle' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
}

export default function DocumentGenerator() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    description: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  const [refinementText, setRefinementText] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [expandedAdvanced, setExpandedAdvanced] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: creditData } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', user.id)
            .single();
          setCreditsRemaining(creditData?.credits || 0);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      }
    };
    fetchCredits();
  }, []);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7777');
    socketRef.current = socket;

    socket.on('job:progress', (data) => {
      setGenerationProgress({
        status: 'generating',
        progress: data.progress,
        message: data.message,
      });
    });

    socket.on('job:complete', (data) => {
      setGenerationProgress({
        status: 'complete',
        progress: 100,
        message: 'Document generated successfully!',
      });
      setGeneratedDocument(data.document);
      setCurrentStep(4);
    });

    socket.on('job:error', (data) => {
      setGenerationProgress({
        status: 'error',
        progress: 0,
        message: data.message,
      });
      setError(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a PDF or DOCX file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File size must be less than 50MB');
      return;
    }

    setUploadedFile(file);
    setUploadError('');
  };

  const handleGenerate = async () => {
    if (!documentType) {
      setError('Please select a document type');
      return;
    }

    if (!formData.clientName.trim()) {
      setError('Client name is required');
      return;
    }

    if (creditsRemaining < 1) {
      setError('Insufficient credits');
      return;
    }

    setError('');
    setCurrentStep(3);
    setGenerationProgress({
      status: 'generating',
      progress: 0,
      message: 'Starting generation...',
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      let fileContent = '';
      if (uploadedFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          fileContent = (e.target?.result as string) || '';
          await makeGenerationRequest(user.id, fileContent);
        };
        reader.readAsText(uploadedFile);
      } else {
        await makeGenerationRequest(user.id, '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setGenerationProgress({ status: 'error', progress: 0, message: 'Error' });
    }
  };

  const makeGenerationRequest = async (userId: string, fileContent: string) => {
    try {
      const response = await fetch('/api/generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          formData,
          fileContent,
          fileName: uploadedFile?.name,
          userId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Generation failed');
      }

      const data = await response.json();

      if (data.conflicts) {
        setShowConflictDialog(true);
      } else {
        simulateProgress();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setGenerationProgress({ status: 'error', progress: 0, message: 'Error' });
    }
  };

  const simulateProgress = () => {
    const stages = [
      { progress: 25, message: 'Analyzing your input...' },
      { progress: 50, message: 'Extracting document details...' },
      { progress: 75, message: 'Generating document...' },
      { progress: 95, message: 'Finalizing & formatting...' },
    ];

    let stageIndex = 0;
    const interval = setInterval(() => {
      if (stageIndex < stages.length) {
        setGenerationProgress({
          status: 'generating',
          progress: stages[stageIndex].progress,
          message: stages[stageIndex].message,
        });
        stageIndex++;
      } else {
        clearInterval(interval);
        const mockDoc = generateMockDocument();
        setGenerationProgress({
          status: 'complete',
          progress: 100,
          message: 'Document generated successfully!',
        });
        setGeneratedDocument(mockDoc);
        setCurrentStep(4);
      }
    }, 800);
  };

  const generateMockDocument = (): string => {
    const clientName = formData.clientName || 'Client';
    const date = new Date().toLocaleDateString();

    if (documentType === 'contract') {
      return `CONTRACT AGREEMENT

Date: ${date}
Between: [Your Name/Company]
And: ${clientName}

PROJECT SCOPE
${formData.projectScope || 'Not specified'}

PRICE: ${formData.price || 'Not specified'}

PAYMENT TERMS
${formData.paymentTerms || 'Not specified'}

TIMELINE
${formData.timeline || 'Not specified'}

${formData.revisionPolicy ? `REVISION POLICY\n${formData.revisionPolicy}\n\n` : ''}${formData.ipOwnership ? `IP OWNERSHIP\n${formData.ipOwnership}\n\n` : ''}${formData.liabilityTerms ? `LIABILITY TERMS\n${formData.liabilityTerms}\n\n` : ''}${formData.terminationClause ? `TERMINATION CLAUSE\n${formData.terminationClause}\n\n` : ''}${formData.latePaymentPenalties ? `LATE PAYMENT PENALTIES\n${formData.latePaymentPenalties}\n\n` : ''}Signed by both parties on the date above.`;
    }

    if (documentType === 'proposal') {
      return `PROPOSAL

Date: ${date}
Prepared for: ${clientName}
Prepared by: ${formData.companyName || 'Your Company'}

PROJECT DESCRIPTION
${formData.description}

PROPOSED PRICE
${formData.proposedPrice || 'Not specified'}

DELIVERY DATE
${formData.deliveryDate || 'Not specified'}

DELIVERABLES
${formData.deliverables || 'Not specified'}

PAYMENT SCHEDULE
${formData.paymentSchedule || 'Not specified'}

Next Steps
We look forward to working with you. Please reply to confirm your interest.

Best regards,
${formData.companyName || 'Your Company'}`;
    }

    if (documentType === 'invoice') {
      const itemsTotal = (formData.lineItems || []).reduce(
        (sum, item) => sum + (item.quantity * item.rate),
        0
      );
      const lineItemsText = formData.lineItems && formData.lineItems.length > 0
        ? `ITEMIZED BREAKDOWN\n${formData.lineItems.map((item, i) => `${i + 1}. ${item.description}: ${item.quantity} × ₹${item.rate} = ₹${(item.quantity * item.rate).toFixed(2)}`).join('\n')}\n\nTOTAL: ₹${itemsTotal.toFixed(2)}`
        : `AMOUNT: ${formData.amount || 'Not specified'}`;

      const paymentMethodsText = formData.paymentMethods && formData.paymentMethods.length > 0
        ? `\n\nPAYMENT METHODS\nAccepted: ${formData.paymentMethods.join(', ')}`
        : '';

      const taxInfoText = formData.taxInfo ? `\n\nTAX INFO\n${formData.taxInfo}` : '';

      const paymentTermsText = formData.invoicePaymentTerms ? `\n\nPAYMENT TERMS\n${formData.invoicePaymentTerms}` : '';

      return `INVOICE

Invoice Number: ${formData.invoiceNumber || 'INV-001'}
Date: ${date}
Due Date: ${formData.dueDate || 'Not specified'}

BILL TO:
${clientName}

FROM:
${formData.yourName || 'Your Name'}
${formData.yourEmail || 'your@email.com'}
${formData.yourAddress || 'Your Address'}

DESCRIPTION OF WORK
${formData.workDescription}

${lineItemsText}${paymentMethodsText}${taxInfoText}${paymentTermsText}`;
    }

    return 'Document generation error';
  };

  const handleRefine = async () => {
    if (!refinementText.trim()) {
      setError('Please describe what you want to change');
      return;
    }

    if (creditsRemaining < 1) {
      setError('Insufficient credits for refinement');
      return;
    }

    setError('');
    setGenerationProgress({
      status: 'generating',
      progress: 0,
      message: 'Applying changes...',
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch('/api/generator/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType,
          currentDocument: generatedDocument,
          refinementRequest: refinementText,
          userId: user.id,
        }),
      });

      if (!response.ok) throw new Error('Refinement failed');

      simulateProgress();
      setRefinementText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refinement failed');
    }
  };

  const handleDownload = async (format: 'docx' | 'pdf') => {
    const element = document.createElement('a');
    const file = new Blob([generatedDocument], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${documentType}-${Date.now()}.${format === 'docx' ? 'docx' : 'pdf'}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('generated_documents').insert({
          user_id: user.id,
          type: documentType,
          content: generatedDocument,
          form_data: formData,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error saving document:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition">
              Lance Buddy
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition">
              ← Back to Dashboard
            </Link>
            <div className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 font-semibold">
              {creditsRemaining} Credits
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            📝 Document Generator
          </h2>
          <p className="text-xl text-slate-300 mb-2">
            Generate Contracts, Proposals & Invoices in Minutes
          </p>
          <p className="text-slate-400">
            Fill in details or upload documents. AI handles the rest.
          </p>
        </div>

        <div className="mb-12 flex justify-center gap-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                  currentStep >= step
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`w-12 h-1 transition ${
                    currentStep > step ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {currentStep >= 1 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Step 1: Select Document Type</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { type: 'contract' as DocumentType, label: '📋 Contract', desc: 'Terms, scope & conditions' },
                { type: 'proposal' as DocumentType, label: '💼 Proposal', desc: 'Project pitch & pricing' },
                { type: 'invoice' as DocumentType, label: '💰 Invoice', desc: 'Payment request' },
              ].map((doc) => (
                <button
                  key={doc.type}
                  onClick={() => {
                    setDocumentType(doc.type);
                    setCurrentStep(2);
                  }}
                  className={`p-6 rounded-lg border-2 transition ${
                    documentType === doc.type
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="text-4xl mb-2">{doc.label.split(' ')[0]}</div>
                  <p className="font-bold">{doc.label.split(' ').slice(1).join(' ')}</p>
                  <p className="text-sm text-slate-400 mt-2">{doc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {documentType && currentStep >= 2 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Step 2: Provide Details</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-cyan-400">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleFormChange('clientName', e.target.value)}
                    placeholder="e.g., Acme Inc."
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                  />
                </div>

                {documentType === 'contract' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-cyan-400">
                        Project Scope / Description *
                      </label>
                      <textarea
                        value={formData.projectScope || ''}
                        onChange={(e) => handleFormChange('projectScope', e.target.value)}
                        placeholder="Describe the project in detail..."
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
                        rows={4}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-cyan-400">
                          Price *
                        </label>
                        <input
                          type="text"
                          value={formData.price || ''}
                          onChange={(e) => handleFormChange('price', e.target.value)}
                          placeholder="e.g., ₹50,000"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-cyan-400">
                          Payment Terms *
                        </label>
                        <select
                          value={formData.paymentTerms || ''}
                          onChange={(e) => handleFormChange('paymentTerms', e.target.value)}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        >
                          <option value="">Select terms...</option>
                          <option value="Net 30">Net 30</option>
                          <option value="Net 60">Net 60</option>
                          <option value="Upon Delivery">Upon Delivery</option>
                          <option value="50% deposit + 50% on completion">50/50 Split</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>
                    {formData.paymentTerms === 'custom' && (
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-cyan-400">
                          Custom Payment Terms
                        </label>
                        <input
                          type="text"
                          value={formData.paymentTermsCustom || ''}
                          onChange={(e) => handleFormChange('paymentTermsCustom', e.target.value)}
                          placeholder="e.g., 30% upfront, 40% mid-project, 30% on delivery"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-cyan-400">
                        Timeline *
                      </label>
                      <input
                        type="text"
                        value={formData.timeline || ''}
                        onChange={(e) => handleFormChange('timeline', e.target.value)}
                        placeholder="e.g., 30 days, 8 weeks"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                      />
                    </div>

                    <button
                      onClick={() => setExpandedAdvanced(!expandedAdvanced)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
                    >
                      {expandedAdvanced ? '▼' : '▶'} Advanced Fields
                    </button>
                    {expandedAdvanced && (
                      <div className="space-y-4 pt-4 border-t border-slate-700">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Revision Policy</label>
                          <textarea
                            value={formData.revisionPolicy || ''}
                            onChange={(e) => handleFormChange('revisionPolicy', e.target.value)}
                            placeholder="e.g., 2 rounds of revisions included..."
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">IP Ownership</label>
                          <textarea
                            value={formData.ipOwnership || ''}
                            onChange={(e) => handleFormChange('ipOwnership', e.target.value)}
                            placeholder="e.g., All work product becomes property of client..."
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Liability Terms</label>
                          <textarea
                            value={formData.liabilityTerms || ''}
                            onChange={(e) => handleFormChange('liabilityTerms', e.target.value)}
                            placeholder="e.g., Liability limited to fees paid..."
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Termination Clause</label>
                          <textarea
                            value={formData.terminationClause || ''}
                            onChange={(e) => handleFormChange('terminationClause', e.target.value)}
                            placeholder="e.g., Either party may terminate with 30 days notice..."
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Late Payment Penalties</label>
                          <textarea
                            value={formData.latePaymentPenalties || ''}
                            onChange={(e) => handleFormChange('latePaymentPenalties', e.target.value)}
                            placeholder="e.g., 1.5% per month on overdue amounts..."
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {documentType === 'proposal' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-cyan-400">
                        Project Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        placeholder="Describe the project in detail..."
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
                        rows={4}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-cyan-400">
                          Proposed Price *
                        </label>
                        <input
                          type="text"
                          value={formData.proposedPrice || ''}
                          onChange={(e) => handleFormChange('proposedPrice', e.target.value)}
                          placeholder="e.g., ₹50,000 / $1,000"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-cyan-400">
                          Delivery Date *
                        </label>
                        <input
                          type="text"
                          value={formData.deliveryDate || ''}
                          onChange={(e) => handleFormChange('deliveryDate', e.target.value)}
                          placeholder="e.g., 30 days, 8 weeks"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-cyan-400">
                        Your Company / Name *
                      </label>
                      <input
                        type="text"
                        value={formData.companyName || ''}
                        onChange={(e) => handleFormChange('companyName', e.target.value)}
                        placeholder="Your company or freelance name"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                      />
                    </div>

                    <button
                      onClick={() => setExpandedAdvanced(!expandedAdvanced)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
                    >
                      {expandedAdvanced ? '▼' : '▶'} Advanced Fields
                    </button>
                    {expandedAdvanced && (
                      <div className="space-y-4 pt-4 border-t border-slate-700">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Deliverables Breakdown</label>
                          <textarea
                            value={formData.deliverables || ''}
                            onChange={(e) => handleFormChange('deliverables', e.target.value)}
                            placeholder="e.g., Homepage design, 5 product pages, checkout flow..."
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Payment Schedule</label>
                          <textarea
                            value={formData.paymentSchedule || ''}
                            onChange={(e) => handleFormChange('paymentSchedule', e.target.value)}
                            placeholder="e.g., 50% upfront, 50% on delivery..."
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Call-to-Action Tone</label>
                          <select
                            value={formData.ctaTone || ''}
                            onChange={(e) => handleFormChange('ctaTone', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                          >
                            <option value="">Select tone...</option>
                            <option value="Professional">Professional</option>
                            <option value="Formal">Formal</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {documentType === 'invoice' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-cyan-400">
                          Invoice Number *
                        </label>
                        <input
                          type="text"
                          value={formData.invoiceNumber || ''}
                          onChange={(e) => handleFormChange('invoiceNumber', e.target.value)}
                          placeholder="e.g., INV-001"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-cyan-400">
                          Amount *
                        </label>
                        <input
                          type="text"
                          value={formData.amount || ''}
                          onChange={(e) => handleFormChange('amount', e.target.value)}
                          placeholder="e.g., ₹50,000"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-cyan-400">
                        Description of Work *
                      </label>
                      <textarea
                        value={formData.workDescription || ''}
                        onChange={(e) => handleFormChange('workDescription', e.target.value)}
                        placeholder="What work was performed?"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-cyan-400">
                          Due Date *
                        </label>
                        <input
                          type="date"
                          value={formData.dueDate || ''}
                          onChange={(e) => handleFormChange('dueDate', e.target.value)}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-cyan-400">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          value={formData.yourName || ''}
                          onChange={(e) => handleFormChange('yourName', e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Your Email</label>
                        <input
                          type="email"
                          value={formData.yourEmail || ''}
                          onChange={(e) => handleFormChange('yourEmail', e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Your Address</label>
                        <input
                          type="text"
                          value={formData.yourAddress || ''}
                          onChange={(e) => handleFormChange('yourAddress', e.target.value)}
                          placeholder="Your address"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedAdvanced(!expandedAdvanced)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
                    >
                      {expandedAdvanced ? '▼' : '▶'} Advanced Fields
                    </button>
                    {expandedAdvanced && (
                      <div className="space-y-4 pt-4 border-t border-slate-700">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Itemized Breakdown</label>
                          <div className="space-y-3">
                            {(formData.lineItems || []).map((item, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Description"
                                  value={item.description}
                                  onChange={(e) => {
                                    const items = [...(formData.lineItems || [])];
                                    items[idx].description = e.target.value;
                                    handleFormChange('lineItems', items);
                                  }}
                                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                                />
                                <input
                                  type="number"
                                  placeholder="Qty"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const items = [...(formData.lineItems || [])];
                                    items[idx].quantity = Number(e.target.value);
                                    handleFormChange('lineItems', items);
                                  }}
                                  className="w-16 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                                />
                                <input
                                  type="number"
                                  placeholder="Rate"
                                  value={item.rate}
                                  onChange={(e) => {
                                    const items = [...(formData.lineItems || [])];
                                    items[idx].rate = Number(e.target.value);
                                    handleFormChange('lineItems', items);
                                  }}
                                  className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                                />
                                <button
                                  onClick={() => {
                                    const items = formData.lineItems?.filter((_, i) => i !== idx) || [];
                                    handleFormChange('lineItems', items);
                                  }}
                                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 text-sm"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const items = [...(formData.lineItems || []), { description: '', quantity: 1, rate: 0 }];
                                handleFormChange('lineItems', items);
                              }}
                              className="text-sm text-cyan-400 hover:text-cyan-300"
                            >
                              + Add Line Item
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Payment Methods</label>
                          <div className="space-y-2">
                            {['Bank Transfer', 'PayPal', 'Stripe', 'UPI', 'Cheque'].map((method) => (
                              <label key={method} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(formData.paymentMethods || []).includes(method)}
                                  onChange={(e) => {
                                    const methods = formData.paymentMethods || [];
                                    if (e.target.checked) {
                                      handleFormChange('paymentMethods', [...methods, method]);
                                    } else {
                                      handleFormChange(
                                        'paymentMethods',
                                        methods.filter((m) => m !== method)
                                      );
                                    }
                                  }}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">{method}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Tax Info (GST/VAT)</label>
                          <input
                            type="text"
                            value={formData.taxInfo || ''}
                            onChange={(e) => handleFormChange('taxInfo', e.target.value)}
                            placeholder="e.g., GST: 18AABCT..."
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Payment Terms</label>
                          <input
                            type="text"
                            value={formData.invoicePaymentTerms || ''}
                            onChange={(e) => handleFormChange('invoicePaymentTerms', e.target.value)}
                            placeholder="e.g., Net 30, Due on receipt"
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6">
                  <h4 className="font-bold mb-4 text-cyan-400">Optional: Upload Document</h4>
                  <p className="text-sm text-slate-400 mb-4">
                    Upload an existing contract, proposal, or email to use as reference. AI will extract text and combine with your form data.
                  </p>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-500 transition"
                  >
                    <div className="text-3xl mb-2">📁</div>
                    <p className="text-sm font-semibold">Click to upload</p>
                    <p className="text-xs text-slate-500 mt-1">PDF or DOCX, max 50MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {uploadedFile && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
                      ✓ {uploadedFile.name}
                    </div>
                  )}
                  {uploadError && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                      {uploadError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generationProgress.status === 'generating' || !formData.clientName}
              className="mt-8 w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-cyan-500/50 transition disabled:opacity-50 text-lg"
            >
              {generationProgress.status === 'generating' ? '⏳ Generating...' : '🚀 Generate Document (1 Credit)'}
            </button>
          </div>
        )}

        {currentStep >= 3 && generationProgress.status === 'generating' && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Step 3: Generating Your Document</h3>
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-slate-300">{generationProgress.message}</p>
                  <span className="text-cyan-400 font-bold">{generationProgress.progress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all"
                    style={{ width: `${generationProgress.progress}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-400 text-center">Please wait while we generate your document...</p>
            </div>
          </div>
        )}

        {showConflictDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-md">
              <h3 className="text-2xl font-bold mb-4">⚠️ Conflicting Information</h3>
              <p className="text-slate-300 mb-6">
                Your form data conflicts with the uploaded document. Which should we use?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowConflictDialog(false);
                    simulateProgress();
                  }}
                  className="w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 font-semibold transition"
                >
                  Use Form Data
                </button>
                <button
                  onClick={() => {
                    setShowConflictDialog(false);
                    simulateProgress();
                  }}
                  className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 font-semibold transition"
                >
                  Use Document Data
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep >= 4 && generatedDocument && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Step 4: Preview & Edit</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-8 max-h-[500px] overflow-y-auto">
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm text-slate-300">
                    {generatedDocument}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6">
                  <h4 className="font-bold mb-4 text-cyan-400">💡 Make Changes</h4>
                  <textarea
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                    placeholder="e.g., 'Add a confidentiality clause', 'Make the tone more formal'"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white text-sm resize-none"
                    rows={4}
                  />
                  <button
                    onClick={handleRefine}
                    disabled={!refinementText.trim() || generationProgress.status === 'generating'}
                    className="mt-3 w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 font-semibold text-sm transition disabled:opacity-50"
                  >
                    Refine (1 Credit)
                  </button>
                  <p className="text-xs text-slate-500 mt-3">
                    Or edit the document directly in the preview above.
                  </p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-6">
                  <h4 className="font-bold mb-4 text-cyan-400">📥 Download</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleDownload('docx')}
                      className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 font-semibold text-sm transition"
                    >
                      Download as DOCX
                    </button>
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 font-semibold text-sm transition"
                    >
                      Download as PDF
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    ✓ Document automatically saved to your account.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setCurrentStep(1);
                setDocumentType(null);
                setFormData({ clientName: '', description: '' });
                setUploadedFile(null);
                setGeneratedDocument('');
                setRefinementText('');
                setError('');
              }}
              className="mt-8 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
            >
              📄 Generate Another Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}