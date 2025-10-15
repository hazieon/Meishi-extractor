import React, { useState } from 'react';
import { ContactInfo } from '../types';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface ResultsDisplayProps {
  contacts: ContactInfo[];
}

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 text-slate-400 bg-slate-700/50 rounded-lg hover:bg-slate-600 hover:text-white transition-all"
            title="Copy to clipboard"
        >
            <ClipboardIcon />
            {copied && <span className="absolute -left-2 top-1/2 -translate-x-full -translate-y-1/2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">Copied!</span>}
        </button>
    );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ contacts }) => {
  const [copiedContactIndex, setCopiedContactIndex] = useState<number | null>(null);
  const emails = contacts.flatMap(c => c.email || []).filter(Boolean).join(', ');

  const handleCopyContact = (contact: ContactInfo, index: number) => {
    const textToCopy = [
        `Name: ${contact.name || ''}`,
        `Title: ${contact.jobTitle || ''}`,
        `Company: ${contact.companyName || ''}`,
        `Email(s): ${(contact.email || []).join(', ')}`,
        `Phone(s): ${(contact.phoneNumber || []).join(', ')}`,
        `Address: ${contact.address || ''}`,
        `Website: ${contact.website || ''}`,
        `LinkedIn: ${contact.linkedinUrl || ''}`,
        `LINE ID: ${contact.lineId || ''}`,
        `QR Code: ${contact.qrCodeUrl || ''}`,
        `Other Info: ${contact.otherInfo || ''}`
    ].filter(line => line.split(': ')[1]).join('\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedContactIndex(index);
        setTimeout(() => setCopiedContactIndex(null), 2000);
    });
  };

  const handleDownloadCsv = () => {
    const headers = ["Name", "Job Title", "Company Name", "Emails", "Phone Numbers", "Address", "LinkedIn URL", "Website", "LINE ID", "QR Code URL", "Other Information"];
    
    const formatRow = (contact: ContactInfo) => {
        const data = [
            contact.name,
            contact.jobTitle,
            contact.companyName,
            (contact.email || []).join('; '),
            (contact.phoneNumber || []).join('; '),
            contact.address,
            contact.linkedinUrl,
            contact.website,
            contact.lineId,
            contact.qrCodeUrl,
            contact.otherInfo,
        ];
        return data.map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(',');
    };

    const csvRows = contacts.map(formatRow);
    const csvString = [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "business_card_contacts.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const ensureUrlProtocol = (url: string) => {
    if (!/^(?:f|ht)tps?:\/\//.test(url)) {
        return `https://${url}`;
    }
    return url;
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-4">All Extracted Emails</h2>
            <div className="relative">
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg font-mono text-sm text-cyan-300 overflow-x-auto">
                    {emails || <span className="text-slate-500">No emails found.</span>}
                </div>
                {emails && <CopyButton textToCopy={emails} />}
            </div>
        </div>

        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-100 mb-2 sm:mb-0">Contacts</h2>
                {contacts.length > 0 && (
                    <button onClick={handleDownloadCsv} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download CSV
                    </button>
                )}
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg">
                <ul className="divide-y divide-slate-700">
                    {contacts.length > 0 ? contacts.map((contact, index) => {
                        const searchKeywords = [contact.name, contact.jobTitle].filter(Boolean).join(' ');
                        const linkedInSearchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(searchKeywords)}`;

                        return (
                            <li key={index} className="relative p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <button
                                    onClick={() => handleCopyContact(contact, index)}
                                    className="absolute top-3 right-3 p-2 text-slate-400 bg-slate-800 rounded-lg hover:bg-slate-700 hover:text-white transition-all z-10"
                                    title="Copy contact details"
                                >
                                    {copiedContactIndex === index ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <ClipboardIcon />
                                    )}
                                </button>
                                <div className="flex-1 space-y-1 pr-10">
                                    <p className="font-semibold text-lg text-slate-200">{contact.name || 'Name not found'}</p>
                                    {contact.companyName && <p className="text-md text-slate-400">{contact.companyName}</p>}
                                    {contact.jobTitle && <p className="text-sm text-slate-500 italic">{contact.jobTitle}</p>}
                                    <div className="pt-2 space-y-1">
                                        {contact.email && contact.email.length > 0 && (
                                            <div>
                                                <strong className="font-medium text-slate-500 w-20 inline-block align-top">Email(s):</strong>
                                                <div className="inline-block">
                                                    {contact.email.map((email, i) => <p key={i} className="text-sm text-slate-400 truncate">{email}</p>)}
                                                </div>
                                            </div>
                                        )}
                                        {contact.phoneNumber && contact.phoneNumber.length > 0 && (
                                            <div>
                                                <strong className="font-medium text-slate-500 w-20 inline-block align-top">Phone(s):</strong>
                                                <div className="inline-block">
                                                    {contact.phoneNumber.map((phone, i) => <p key={i} className="text-sm text-slate-400 truncate">{phone}</p>)}
                                                </div>
                                            </div>
                                        )}
                                        {contact.address && <p className="text-sm text-slate-400"><strong className="font-medium text-slate-500 w-20 inline-block">Location:</strong> {contact.address}</p>}
                                        {contact.website && <p className="text-sm text-slate-400 truncate"><strong className="font-medium text-slate-500 w-20 inline-block">Web:</strong> <a href={ensureUrlProtocol(contact.website)} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1">{contact.website}<ExternalLinkIcon /></a></p>}
                                        {contact.lineId && <p className="text-sm text-slate-400"><strong className="font-medium text-slate-500 w-20 inline-block">LINE:</strong> {contact.lineId}</p>}
                                        {contact.qrCodeUrl && <p className="text-sm text-slate-400 truncate"><strong className="font-medium text-slate-500 w-20 inline-block">QR Code:</strong> <a href={ensureUrlProtocol(contact.qrCodeUrl)} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-1">{contact.qrCodeUrl}<ExternalLinkIcon /></a></p>}
                                        {contact.otherInfo && <p className="text-sm text-slate-400"><strong className="font-medium text-slate-500 w-20 inline-block">Other:</strong> {contact.otherInfo}</p>}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 self-center">
                                    {contact.linkedinUrl ? (
                                        <a
                                            href={ensureUrlProtocol(contact.linkedinUrl)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            View LinkedIn
                                        </a>
                                    ) : (
                                        <a
                                            href={linkedInSearchUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
                                        >
                                            Search LinkedIn
                                        </a>
                                    )}
                                </div>
                            </li>
                        )
                    }) : (
                        <li className="p-4 text-center text-slate-500">No contacts found.</li>
                    )}
                </ul>
            </div>
        </div>
    </div>
  );
};