import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { application_id } = body;

    if (!application_id) {
      return NextResponse.json({ error: 'Missing application_id' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    // 1. Fetch Application Record
    const { data: app, error: fetchError } = await supabase
      .from('farmer_applications')
      .select('*')
      .eq('id', application_id)
      .single();

    if (fetchError || !app) {
      throw new Error('Application not found in the database.');
    }

    // 2. Fetch ALL documents from the record
    const documentUrls = (app.document_urls || []) as string[];
    const processedDocuments: { buffer: Buffer, mimeType: string, url: string }[] = [];
    isMockFallback = documentUrls.length === 0;

    if (!isMockFallback) {
      for (const url of documentUrls) {
        if (!url || typeof url !== 'string' || !url.startsWith('http')) continue;
        
        try {
          const fileResponse = await fetch(url);
          if (!fileResponse.ok) continue;

          const arrayBuffer = await fileResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          let mimeType = fileResponse.headers.get('content-type') || 'application/pdf';
          
          let finalBuffer = buffer;
          if (!mimeType.includes('pdf')) {
            finalBuffer = await sharp(buffer)
              .grayscale()
              .normalize()
              .resize({ width: 1600, withoutEnlargement: true })
              .webp({ quality: 85 })
              .toBuffer();
            mimeType = 'image/webp';
          }
          
          processedDocuments.push({ buffer: finalBuffer, mimeType, url });
        } catch (err) {
          console.warn(`[Deep Audit] Failed to process document ${url}:`, err);
        }
      }
    }

    // Final check: if no documents were successfully processed but URLs existed, we still might be in fallback mode
    if (processedDocuments.length === 0 && !isMockFallback) {
      isMockFallback = true;
    }

    // 3. Initialize Gemini 2.5 Flash with JSON output mode
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // 4. Construct the prompt - Strict JSON Schema for UI rendering
    const initialFlag = app.discrepancy_reason || "Possible data mismatch or OCR ambiguity";
    const claimedArea = app.land_area || app.land_size_ha || null;
    
    const prompt = `You are an expert Maharashtrian agricultural auditor and fraud-detection AI. 
Analyze the provided documents (7/12 extract, 8A holding, and Aadhaar) against the farmer's application.
Scheme: "${app.scheme_name || 'Agricultural Subsidy'}".
Claimed Land Area: ${claimedArea ? `${claimedArea} Hectares` : 'MISSING'}.
SYSTEM ALERT (Initial Flag): "${initialFlag}".

TASK:
Provide a decisive, point-wise audit verdict. 
If this is a SEEDED DEMO RECORD (no physical documents provided), SIMULATE a realistic audit of the following three standard documents based on the initial system flag:
1. 7/12 Extract (Satbara Utara)
2. 8A Holding Document
3. Aadhaar Card

STRICT OUTPUT SCHEMA:
{
  "overall_verdict": "Safe" | "Action_Required",
  "document_evaluations": [
    {
      "document_name": string (e.g. "7/12 Extract", "Aadhaar Card"),
      "status": "Safe" | "Suspicious",
      "clerk_explanation": string (1-2 simple sentences in plain English/Marathi for the clerk),
      "cross_document_impact": string (how this issue invalidates or affects other documents in the set)
    }
  ]
}

INSTRUCTIONS:
- If a document is missing, mark it as "Suspicious" with explanation "Document not found in record".
- If the system flag is "${initialFlag}", ensure your verdict elaborates on WHY this is correct.
- Be decisive. Use Green/Red logic in your evaluations.
${isMockFallback ? "\nNOTE: This is a DEMO record. Simulate the evaluation for the standard documents listed above based on the system alert." : ""}`;

    const promptParts: any[] = [prompt];
    processedDocuments.forEach(doc => {
      promptParts.push({
        inlineData: {
          data: doc.buffer.toString('base64'),
          mimeType: doc.mimeType,
        },
      });
    });

    // 5. Implement strict 25-second timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Audit timed out. Please try again.')), 25000)
    );

    const result = (await Promise.race([
      model.generateContent(promptParts),
      timeoutPromise
    ])) as any;

    const response = await result.response;
    let jsonText = response.text();
    
    // Clean JSON if it's wrapped in markdown code blocks
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    let auditData;
    try {
      auditData = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error("[Deep Audit] JSON Parse Failed. Raw text:", jsonText);
      // Fallback to a structured error object so the UI doesn't crash
      auditData = {
        overall_verdict: "Action_Required",
        document_evaluations: [
          {
            document_name: "Audit System Error",
            status: "Suspicious",
            clerk_explanation: "The AI audit returned an unparseable response. Please check the raw logs or retry.",
            cross_document_impact: "System reliability alert."
          }
        ]
      };
    }

    return NextResponse.json({ 
      audit_report: auditData, 
      document_urls: processedDocuments.map(d => d.url),
      is_fallback: isMockFallback 
    });

  } catch (error: any) {
    console.error('Deep Audit Error:', error);
    // Explicitly handle the timeout error message
    if (error.message === 'Audit timed out. Please try again.') {
      return NextResponse.json({ error: error.message }, { status: 504 }); // 504 Gateway Timeout
    }
    return NextResponse.json({ error: error.message || 'Failed to run Deep AI Audit.' }, { status: 500 });
  }
}
