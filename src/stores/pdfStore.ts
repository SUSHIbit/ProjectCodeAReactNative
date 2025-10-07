import { create } from 'zustand';
import { supabase } from '../services/supabase';
import * as DocumentPicker from 'expo-document-picker';
import type { PDF } from '../types';

interface PDFStore {
  currentPdf: PDF | null;
  uploadProgress: number;
  uploadLoading: boolean;
  uploadError: string | null;
  generateLoading: boolean;
  generateError: string | null;
  uploadPdf: (file: DocumentPicker.DocumentPickerAsset) => Promise<void>;
  generateMcqs: (pdfId: string) => Promise<void>;
  clearErrors: () => void;
  reset: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const usePdfStore = create<PDFStore>((set, get) => ({
  currentPdf: null,
  uploadProgress: 0,
  uploadLoading: false,
  uploadError: null,
  generateLoading: false,
  generateError: null,

  uploadPdf: async (file: DocumentPicker.DocumentPickerAsset) => {
    try {
      set({ uploadLoading: true, uploadError: null, uploadProgress: 0 });

      // Validate file type
      if (file.mimeType !== 'application/pdf') {
        throw new Error('Please select a valid PDF file.');
      }

      // Validate file size
      if (file.size && file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 10MB limit. Please choose a smaller PDF.');
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to upload files.');
      }

      // Prepare file for upload
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Read the file as array buffer for React Native
      const response = await fetch(file.uri);
      const arrayBuffer = await response.arrayBuffer();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, arrayBuffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        throw new Error('Failed to upload PDF. Please try again.');
      }

      set({ uploadProgress: 50 });

      // Save PDF metadata to database
      const { data: pdfData, error: dbError } = await supabase
        .from('pdfs')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size || 0,
          processed: false,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('pdfs').remove([fileName]);
        throw new Error('Failed to save PDF information. Please try again.');
      }

      set({
        currentPdf: pdfData,
        uploadProgress: 100,
        uploadLoading: false,
      });
    } catch (error: any) {
      set({
        uploadError: error.message || 'An unexpected error occurred during upload.',
        uploadLoading: false,
        uploadProgress: 0,
      });
    }
  },

  generateMcqs: async (pdfId: string) => {
    try {
      set({ generateLoading: true, generateError: null });

      const { currentPdf } = get();
      if (!currentPdf) {
        throw new Error('No PDF found. Please upload a PDF first.');
      }

      // Call the Supabase Edge Function to generate MCQs
      const { data, error } = await supabase.functions.invoke('generate-mcqs', {
        body: {
          pdfPath: currentPdf.file_path,
          pdfId: pdfId,
        },
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to generate questions. Please try again later.');
      }

      // Update the current PDF's processed status
      const { data: updatedPdf, error: updateError } = await supabase
        .from('pdfs')
        .update({ processed: true })
        .eq('id', pdfId)
        .select()
        .single();

      if (updateError) {
        throw new Error('Failed to update PDF status.');
      }

      set({
        currentPdf: updatedPdf,
        generateLoading: false,
      });
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred while generating questions.';

      // User-friendly error messages
      if (error.message?.includes('No text found')) {
        errorMessage = 'No text found in PDF. Please upload a PDF with readable text content.';
      } else if (error.message?.includes('Unable to read PDF')) {
        errorMessage = 'Unable to read PDF file. Please ensure it\'s a valid, readable PDF document.';
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = 'Connection failed. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({
        generateError: errorMessage,
        generateLoading: false,
      });
    }
  },

  clearErrors: () => set({ uploadError: null, generateError: null }),

  reset: () => set({
    currentPdf: null,
    uploadProgress: 0,
    uploadLoading: false,
    uploadError: null,
    generateLoading: false,
    generateError: null,
  }),
}));
