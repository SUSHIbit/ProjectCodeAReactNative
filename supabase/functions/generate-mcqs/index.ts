// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import pdf from "npm:pdf-parse@1.1.1";
import OpenAI from "npm:openai@4.20.1";

// Type definitions
interface PDFResult {
  text: string;
  numpages: number;
  info: any;
}

interface MCQData {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Edge Function invoked");
    console.log("Request method:", req.method);

    // Parse request body
    const { pdfPath, pdfId } = await req.json();
    console.log("Received pdfPath:", pdfPath);
    console.log("Received pdfId:", pdfId);

    if (!pdfPath || !pdfId) {
      return new Response(
        JSON.stringify({ error: "Missing pdfPath or pdfId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with automatic environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("Environment check:");
    console.log("SUPABASE_URL exists:", !!supabaseUrl);
    console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseServiceKey);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download PDF from Supabase Storage
    console.log("Attempting to download PDF from path:", pdfPath);
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from("pdfs")
      .download(pdfPath);

    if (downloadError || !pdfData) {
      console.error("Download error:", downloadError);
      console.error("Error details:", JSON.stringify(downloadError));
      return new Response(
        JSON.stringify({
          error: `Failed to download PDF from storage: ${downloadError?.message || 'Unknown error'}`,
          details: downloadError
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("PDF downloaded successfully, size:", pdfData.size);

    // Convert blob to buffer
    const arrayBuffer = await pdfData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Extract text from PDF
    let extractedText: string;
    try {
      const pdfResult: PDFResult = await pdf(buffer);
      extractedText = pdfResult.text;

      if (!extractedText || extractedText.trim().length === 0) {
        return new Response(
          JSON.stringify({
            error: "No text found in PDF. Please upload a PDF with readable text content."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for minimum content length (approximately 500 characters for quality MCQs)
      const minContentLength = 500;
      if (extractedText.trim().length < minContentLength) {
        return new Response(
          JSON.stringify({
            error: "Insufficient content to generate 10 questions. Please upload a longer PDF with at least 1-2 pages of text."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Extracted text length: ${extractedText.length} characters`);
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      return new Response(
        JSON.stringify({
          error: "Unable to read PDF file. Please ensure it's a valid, readable PDF document."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize OpenAI
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    console.log("OpenAI API key exists:", !!openaiApiKey);

    if (!openaiApiKey) {
      console.error("Missing OpenAI API key");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Generate MCQs using OpenAI
    const prompt = `Generate 10 multiple-choice questions from the following text.
The questions should be university level or above, suitable for adult learners.
Each question should have 4 options (A, B, C, D) with only one correct answer.

Return the response as a JSON array with this exact format:
[
  {
    "question": "Question text here?",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A"
  }
]

Text to analyze:
${extractedText.substring(0, 12000)}`; // Limit text to avoid token limits

    let mcqsData: MCQData[];
    try {
      console.log("Calling OpenAI API...");
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates educational multiple-choice questions. Always respond with valid JSON only, no additional text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      console.log("OpenAI API call successful");
      console.log("Completion:", JSON.stringify(completion, null, 2));

      const responseText = completion.choices[0]?.message?.content;
      console.log("Response text:", responseText);

      if (!responseText) {
        throw new Error("Empty response from OpenAI");
      }

      // Clean up response text (remove markdown code blocks if present)
      let cleanedResponse = responseText.trim();

      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

      // Remove any leading/trailing whitespace again after cleanup
      cleanedResponse = cleanedResponse.trim();

      console.log("Cleaned response (first 500 chars):", cleanedResponse.substring(0, 500));

      // Try to extract JSON array if it's embedded in text
      if (!cleanedResponse.startsWith('[')) {
        const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
          console.log("Extracted JSON array from response");
        }
      }

      // Parse OpenAI response
      mcqsData = JSON.parse(cleanedResponse);
      console.log("Parsed MCQ data, count:", mcqsData.length);

      // Validate response structure
      if (!Array.isArray(mcqsData) || mcqsData.length !== 10) {
        throw new Error("Invalid response format: expected array of 10 questions");
      }

      // Validate each question
      for (const mcq of mcqsData) {
        if (
          !mcq.question ||
          !mcq.options ||
          !mcq.options.A ||
          !mcq.options.B ||
          !mcq.options.C ||
          !mcq.options.D ||
          !mcq.correctAnswer ||
          !["A", "B", "C", "D"].includes(mcq.correctAnswer)
        ) {
          throw new Error("Invalid question format");
        }
      }
    } catch (openaiError: any) {
      console.error("OpenAI error:", openaiError);
      console.error("OpenAI error message:", openaiError?.message);
      console.error("OpenAI error stack:", openaiError?.stack);

      // Try to extract more specific error information
      let errorMessage = "Failed to generate questions. Please try again later.";

      if (openaiError?.message) {
        // Check for specific OpenAI errors
        if (openaiError.message.includes("API key")) {
          errorMessage = "OpenAI API key error. Please contact support.";
        } else if (openaiError.message.includes("rate limit") || openaiError.message.includes("quota")) {
          errorMessage = "OpenAI API rate limit exceeded. Please try again later.";
        } else if (openaiError.message.includes("network") || openaiError.message.includes("timeout")) {
          errorMessage = "Network error connecting to OpenAI. Please try again.";
        } else if (openaiError.message.includes("Invalid response format") || openaiError.message.includes("Invalid question format")) {
          errorMessage = "Failed to parse AI response. Please try again with a different PDF.";
        } else {
          // Include the actual error message for debugging
          errorMessage = `AI generation error: ${openaiError.message}`;
        }
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: openaiError?.message || "Unknown error"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save MCQs to database
    const mcqsToInsert = mcqsData.map((mcq) => ({
      pdf_id: pdfId,
      question: mcq.question,
      option_a: mcq.options.A,
      option_b: mcq.options.B,
      option_c: mcq.options.C,
      option_d: mcq.options.D,
      correct_answer: mcq.correctAnswer,
    }));

    const { error: insertError } = await supabase
      .from("mcqs")
      .insert(mcqsToInsert);

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save questions to database" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update PDF processed status
    const { error: updateError } = await supabase
      .from("pdfs")
      .update({ processed: true })
      .eq("id", pdfId);

    if (updateError) {
      console.error("Database update error:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "10 questions generated successfully",
        questionsCount: 10
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Connection failed. Please check your internet connection."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
