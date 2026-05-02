'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Service Role Key bypasses RLS — fine for hackathon demo
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function submitFarmerApplication(prevState: any, formData: FormData) {
  try {
    const farmerName = formData.get('farmerName') as string;
    const aadhaarNumber = formData.get('aadhaarNumber') as string;
    const surveyNumber = formData.get('surveyNumber') as string;
    const district = formData.get('district') as string;
    const taluka = formData.get('taluka') as string;
    const schemeName = formData.get('schemeName') as string;

    // Validation
    if (!farmerName || !aadhaarNumber || !district) {
      return { success: false, error: 'Farmer Name, Aadhaar, and District are required.' };
    }

    // Generate a human-readable farmer_id
    const farmerId = `FARMER_${farmerName.replace(/\s+/g, '_').toUpperCase()}_${aadhaarNumber.slice(-4)}`;

    // Insert into farmer_applications with status 'Pending'
    // The AI batch processor picks up 'Pending' applications and routes them
    const { data, error } = await supabaseAdmin
      .from('farmer_applications')
      .insert({
        farmer_id: farmerId,
        scheme_id: 'SCH_PRAGATI_001',
        scheme_name: schemeName || 'Namo Shetkari Mahasanman Nidhi',
        status: 'Pending',
        discrepancy_reason: null,
        is_manually_overridden: false,
        document_urls: [],
      })
      .select('id')
      .single();

    if (error) throw error;

    // Bust the cache so the clerk sees it immediately after AI batch runs
    revalidatePath('/clerk/queue');
    revalidatePath('/clerk');
    revalidatePath('/tao/dashboard');

    return { 
      success: true, 
      applicationId: data?.id,
      farmerId: farmerId,
    };
  } catch (error: any) {
    console.error('Farmer Application Submit Error:', error);
    return { success: false, error: error.message };
  }
}
