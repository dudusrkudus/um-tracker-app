import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use service role

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('teams')
    .select('team_code, team_name')
    .or('team_name.ilike.%Run84Fun%,team_code.ilike.%Run84Fun%,team_code.ilike.%R4%');
    
  console.log("Teams:", data);
}

test();
