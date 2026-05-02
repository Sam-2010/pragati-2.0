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

// Deterministic rule-based classifier — NO randomness, NO hallucination.
// Each rule checks real application fields. This is reproducible: same input = same output.
function classifyApplication(app: any): {
  verdict: string;
  proposed_status: string;
  discrepancy_reason: string | null;
} {
  const issues: string[] = [];

  // Rule 1: Missing critical fields
  const farmerName = app.farmer_name || app.farmer_id || '';
  const landArea = parseFloat(app.land_area || app.land_size_ha || '0');
  const scheme = app.scheme_name || '';

  if (!farmerName || farmerName.trim() === '') {
    issues.push("Farmer identity (name/ID) is missing from the record.");
  }

  if (landArea <= 0) {
    issues.push("Claimed land area is missing or zero — cannot verify eligibility.");
  }

  // Rule 2: Document availability check
  const docUrls = (app.document_urls || []) as string[];
  const validDocs = docUrls.filter((u: string) => u && typeof u === 'string' && u.startsWith('http'));

  if (validDocs.length === 0) {
    issues.push("No uploaded documents found. 7/12 Extract and Aadhaar are required.");
  } else if (validDocs.length < 2) {
    issues.push(`Only ${validDocs.length} document(s) uploaded. Minimum 2 required (7/12 + Aadhaar).`);
  }

  // Rule 3: Land area threshold for micro-irrigation schemes
  if (scheme.toLowerCase().includes('micro-irrigation') || scheme.toLowerCase().includes('sinchayee')) {
    if (landArea > 10) {
      issues.push(`Land area (${landArea} Ha) exceeds typical micro-irrigation threshold of 10 Ha. Verify eligibility.`);
    }
  }

  // Rule 4: If existing discrepancy flag from a previous run, propagate it
  if (app.discrepancy_reason && app.status === 'Action_Required') {
    issues.push(app.discrepancy_reason);
  }

  // Decision: If any issues found → flag for clerk review. Otherwise → verified.
  if (issues.length > 0) {
    return {
      verdict: issues.length >= 2 ? 'Risky — multiple issues detected' : 'Needs manual supervision',
      proposed_status: 'Action_Required',
      discrepancy_reason: issues.join(' | '),
    };
  }

  return {
    verdict: 'Safe to pass — no discrepancies found',
    proposed_status: 'Verified_by_AI',
    discrepancy_reason: null,
  };
}

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

    // 2. Deterministic AI Processing — same input always gives same output
    const evaluations = pendingApps.map((app) => {
      const result = classifyApplication(app);

      if (result.proposed_status === 'Verified_by_AI') {
        routedToOfficer++;
      } else {
        routedToClerk++;
      }

      return {
        ...app,
        verdict: result.verdict,
        proposed_status: result.proposed_status,
        discrepancy_reason: result.discrepancy_reason,
      };
    });

    // Return evaluations for the Human-in-the-Loop modal
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
