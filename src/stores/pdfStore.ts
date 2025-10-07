import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { getUserFriendlyError } from '../utils/errorHandler';
import { validateFileName } from '../utils/validation';
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

      // Validate file name
      const fileNameValidation = validateFileName(file.name);
      if (!fileNameValidation.valid) {
        throw new Error(fileNameValidation.message);
      }

      // Validate file type
      if (file.mimeType !== 'application/pdf') {
        throw new Error('Please select a valid PDF file.');
      }

      // Validate file size
      if (file.size && file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 10MB limit. Please choose a smaller PDF.');
      }

      // Check for zero-size files
      if (file.size === 0) {
        throw new Error('The selected file is empty. Please choose a valid PDF file.');
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
        uploadError: getUserFriendlyError(error, 'pdf_upload'),
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
      let response;
      try {
        response = await supabase.functions.invoke('generate-mcqs', {
          body: {
            pdfPath: currentPdf.file_path,
            pdfId: pdfId,
          },
        });
      } catch (invokeError: any) {
        console.error('Invoke threw exception:', invokeError);
        throw new Error('Failed to connect to server. Please try again.');
      }

      const { data, error } = response;

      // Debug logging
      console.log('Edge Function Response:', { data, error });
      console.log('Error object:', error);
      console.log('Error stringified:', JSON.stringify(error, null, 2));

      // Handle FunctionsHttpError (non-2xx status codes)
      if (error) {
        const errorObj = error as any;
        let errorMessage = 'Failed to generate questions. Please try again later.';

        // The context property is a Response object
        if (errorObj.context && typeof errorObj.context === 'object') {
          try {
            // Clone the response to be able to read it
            const responseClone = errorObj.context.clone ? errorObj.context.clone() : errorObj.context;

            // Try to read the response body as JSON
            const responseBody = await responseClone.json();
            console.log('Response body:', responseBody);

            if (responseBody && responseBody.error) {
              errorMessage = responseBody.error;
            }
          } catch (jsonError) {
            console.error('Failed to parse response body:', jsonError);
          }
        } else if (errorObj.message) {
          errorMessage = errorObj.message;
        }

        console.error('Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      // Check if there's an error in the data
      if (data && data.error) {
        console.error('Edge Function returned error in data:', data.error);
        throw new Error(data.error);
      }

      if (!data || !data.success) {
        console.error('Invalid response:', data);
        throw new Error(data?.error || 'Failed to generate questions. Please try again later.');
      }

      console.log('MCQs generated successfully');

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
      set({
        generateError: getUserFriendlyError(error, 'pdf_generation'),
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
