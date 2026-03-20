import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Download, Trash2, UploadCloud } from 'lucide-react';
import api from '../../utils/api';
import useAuthStore from '../../stores/authStore.js';

export default function DocumentsDrawer({ isOpen, onClose, entityId, entityType, title, documents = [], onUpload, onDelete }) {
  const [visible, setVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const { user } = useAuthStore();
  const canManageDocs = user?.role === 'admin' || user?.role === 'relationship_manager' || user?.role === 'client';

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);

    try {
      setUploading(true);
      const res = await api.post(`/upload/${entityType}/${entityId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (onUpload) onUpload(res.data.document);
    } catch (error) {
      console.error('Upload error', error);
      alert('Failed to upload document. Max limit 10MB.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/upload/${entityType}/${entityId}/${docId}`);
      if (onDelete) onDelete(docId);
    } catch (error) {
      console.error('Delete error', error);
      alert('Failed to delete document');
    }
  };

  if (!isOpen && !visible) return null;

  // Build root URL since url is just /uploads/...
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const ROOT_URL = API_URL.replace('/api', '');

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${visible ? 'bg-stone-950/20 backdrop-blur-[2px]' : 'bg-transparent'}`} 
        onClick={handleClose} 
      />
      <div className={`relative w-full max-w-md bg-[#faf9f7] shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="sticky top-0 bg-[#faf9f7] border-b border-stone-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-1">{title || 'Documents'}</p>
            <h3 className="font-display text-lg font-medium leading-tight text-stone-900">Attachments</h3>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0 ml-3">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Upload Section */}
          {canManageDocs && (
            <div>
               <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-3">Upload Document</p>
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className={`border-2 border-dashed border-stone-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
               >
                 <UploadCloud className="w-8 h-8 text-stone-300 mb-2" />
                 <span className="text-xs font-medium text-stone-600">
                   {uploading ? 'Uploading...' : 'Click to select a file'}
                 </span>
                 <span className="text-[10px] text-stone-400 mt-1">PDF, Excel, Word, Images up to 10MB</span>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileChange} 
                   className="hidden" 
                   accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.csv" 
                 />
               </div>
            </div>
          )}

          {/* Document List */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-3">
              Files <span className="text-stone-300 ml-1">{documents.length}</span>
            </p>

            {documents.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No documents attached.</p>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div key={doc._id} className="bg-white p-3 rounded-xl border border-stone-200/60 shadow-sm flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-stone-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-stone-800 truncate" title={doc.name}>{doc.name}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {new Date(doc.uploadedAt).toLocaleDateString()} 
                        {doc.uploadedBy?.name && ` • ${doc.uploadedBy.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={`${ROOT_URL}${doc.url}`} 
                        download 
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-md transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {canManageDocs && (
                        <button 
                          onClick={() => handleDelete(doc._id)}
                          className="p-1.5 text-stone-400 hover:text-[#c0604a] hover:bg-[#c0604a]/10 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
