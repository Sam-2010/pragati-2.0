import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client to bypass RLS for server-side batch processing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Realistic bilingual discrepancies for the MahaDBT context
const DISCREPANCY_REASONS = [
  "Name mismatch between Aadhaar and 7/12 extract (Spelling variation detected). / आधार आणि ७/१२ उताऱ्यामध्ये नावात तफावत.",
  "Area mismatch: 8A holding shows lower area than claimed. / ८अ उताऱ्यानुसार क्षेत्र कमी आहे.",
  "Bank IFSC code inactive or branch merged. Needs manual verification. / बँक IFSC कोड चुकीचा आहे.",
  "Document scan blurry or unreadable. OCR confidence below threshold (42%). / दस्तऐवज स्कॅन अस्पष्ट आहे.",
  "Joint ownership detected without NOC/consent signature on 7/12. / ७/१२ वर संयुक्त मालकी पण संमतीपत्र नाही."
];

async function runAIBatch() {
  try {
    // 1. Fetch pending applications
    const { data: pendingApps, error: fetchError } = await supabaseAdmin
      .from('farmer_applications')
      .select('*')
      .eq('status', 'Pending');

    if (fetchError) {
      throw new Error(`Database fetch error: ${fetchError.message}`);
    }

    if (!pendingApps || pendingApps.length === 0) {
      return NextResponse.json({ message: "No pending applications found." }, { status: 200 });
    }

    let routedToOfficer = 0;
    let routedToClerk = 0;
    
    // 2. Simulate AI Processing & Prepare batch updates
    const evaluations = pendingApps.map((app) => {
      // 70% chance of passing AI verification perfectly
      const isPerfectMatch = Math.random() > 0.3;

      if (isPerfectMatch) {
        routedToOfficer++;
        return {
          ...app,
          verdict: 'Safe to pass & no suspicion',
          proposed_status: 'Verified_by_AI',
          discrepancy_reason: null,
        };
      } else {
        routedToClerk++;
        const randomReason = DISCREPANCY_REASONS[Math.floor(Math.random() * DISCREPANCY_REASONS.length)];
        return {
          ...app,
          verdict: Math.random() > 0.5 ? 'Needs manual supervision' : 'Risky and suspicious',
          proposed_status: 'Action_Required',
          discrepancy_reason: randomReason,
        };
      }
    });

    // Instead of upserting, return the evaluations for the Human-in-the-Loop modal
    return NextResponse.json({
      message: "AI Batch Processing Complete. Awaiting Human Review.",
      processed_count: evaluations.length,
      routed_to_officer: routedToOfficer,
      routed_to_clerk: routedToClerk,
      evaluations,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error: any) {
    console.error("AI Batch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Export Handlers
export async function GET() {
  return runAIBatch();
}

export async function POST() {
  return runAIBatch();
}
