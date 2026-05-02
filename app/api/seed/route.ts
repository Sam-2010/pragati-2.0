import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Standalone seed route for hackathon demo
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const MOCK_DATA = [
  // 5 PENDING (For AI Batch Processor)
  { name: "Tukaram Patil", aadhaar: "4532 8876 1234", dist: "Kolhapur", taluka: "Karveer", area: 2.4, status: "Pending" },
  { name: "Savitri Deshmukh", aadhaar: "9921 4456 7781", dist: "Pune", taluka: "Haveli", area: 1.8, status: "Pending" },
  { name: "Vitthal Rao", aadhaar: "3342 1100 9982", dist: "Solapur", taluka: "Pandharpur", area: 3.2, status: "Pending" },
  { name: "Ananda Shinde", aadhaar: "6671 2234 5543", dist: "Satara", taluka: "Karad", area: 0.9, status: "Pending" },
  { name: "Gajanan Mane", aadhaar: "8890 1122 3344", dist: "Sangli", taluka: "Miraj", area: 4.5, status: "Pending" },

  // 5 ACTION_REQUIRED (For Clerk Exception Queue)
  { 
    name: "Sunita Kadam", aadhaar: "1234 5678 9012", dist: "Pune", taluka: "Maval", area: 1.5, status: "Action_Required",
    reason: "Name mismatch: 'Sunita' in Aadhaar vs 'Sunitabai' in 7/12 extract. / आधार आणि ७/१२ उताऱ्यामध्ये नावात तफावत."
  },
  { 
    name: "Ramesh Pawar", aadhaar: "9876 5432 1098", dist: "Nashik", taluka: "Niphad", area: 2.1, status: "Action_Required",
    reason: "Document scan blurry. AI OCR confidence 38%. Needs manual review. / दस्तऐवज स्कॅन अस्पष्ट आहे."
  },
  { 
    name: "Eknath Shinde", aadhaar: "5566 7788 9900", dist: "Thane", taluka: "Kalyan", area: 5.2, status: "Action_Required",
    reason: "Joint ownership detected without NOC on 7/12. / ७/१२ वर संयुक्त मालकी पण संमतीपत्र नाही."
  },
  { 
    name: "Meera Gaikwad", aadhaar: "1122 3344 5566", dist: "Aurangabad", taluka: "Paithan", area: 1.2, status: "Action_Required",
    reason: "Area mismatch: 8A holding shows 0.8ha but claimed 1.2ha. / ८अ उताऱ्यानुसार क्षेत्र कमी आहे."
  },
  { 
    name: "Baburao Ganpat", aadhaar: "4455 6677 8899", dist: "Nagpur", taluka: "Ramtek", area: 2.8, status: "Action_Required",
    reason: "Bank IFSC code inactive. Needs verification of passbook. / बँक IFSC कोड चुकीचा आहे."
  },

  // 5 VERIFIED_BY_CLERK (For Officer Dashboard)
  { name: "Dilip Vengsarkar", aadhaar: "1010 2020 3030", dist: "Mumbai", taluka: "Andheri", area: 0.5, status: "Verified_by_Clerk" },
  { name: "Sachin Tendulkar", aadhaar: "1111 2222 3333", dist: "Ratnagiri", taluka: "Dapoli", area: 2.0, status: "Verified_by_Clerk" },
  { name: "Sharad Pawar", aadhaar: "2222 3333 4444", dist: "Baramati", taluka: "Baramati", area: 10.5, status: "Verified_by_Clerk" },
  { name: "Nitin Gadkari", aadhaar: "3333 4444 5555", dist: "Nagpur", taluka: "Nagpur Urban", area: 4.2, status: "Verified_by_Clerk" },
  { name: "Ajit Dada", aadhaar: "4444 5555 6666", dist: "Pune", taluka: "Indapur", area: 6.8, status: "Verified_by_Clerk" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'pragati2026') {
    return NextResponse.json({ error: "Unauthorized: Invalid secret token" }, { status: 401 });
  }

  try {
    // Clear existing data for fresh demo? Optional, but safer to just append
    // const { error: deleteError } = await supabaseAdmin.from('farmer_applications').delete().neq('id', '0');

    const applications = MOCK_DATA.map(m => ({
      farmer_id: `FARMER_${m.name.replace(/\s+/g, '_').toUpperCase()}_${m.aadhaar.slice(-4)}`,
      scheme_id: 'SCH_PRAGATI_001',
      scheme_name: 'Namo Shetkari Mahasanman Nidhi',
      status: m.status,
      discrepancy_reason: m.reason || null,
      is_manually_overridden: false,
      document_urls: [],
      // Realistic timestamp spread
      created_at: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
    }));

    const { data, error } = await supabaseAdmin
      .from('farmer_applications')
      .insert(applications)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${data.length} records into farmer_applications`,
      records: data
    }, { status: 200 });

  } catch (error: any) {
    console.error("Seeding Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
