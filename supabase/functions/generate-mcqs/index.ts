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
    // Parse request body
    const { pdfPath, pdfId } = await req.json();

    if (!pdfPath || !pdfId) {
      return new Response(
        JSON.stringify({ error: "Missing pdfPath or pdfId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download PDF from Supabase Storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from("pdfs")
      .download(pdfPath);

    if (downloadError || !pdfData) {
      console.error("Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download PDF from storage" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;
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

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("Empty response from OpenAI");
      }

      // Parse OpenAI response
      mcqsData = JSON.parse(responseText);

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
    } catch (openaiError) {
      console.error("OpenAI error:", openaiError);
      return new Response(
        JSON.stringify({
          error: "Failed to generate questions. Please try again later."
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
