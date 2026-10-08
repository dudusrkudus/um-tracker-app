import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing as ANON user...");
  
  const { data: event, error: eventErr } = await supabase
    .from('events')
    .select('*')
    .in('status', ['live', 'ready'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  console.log("Event:", event?.id, eventErr?.message);
  
  if (event) {
    const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('*, categories(code), runners(full_name, relay_order, status)')
      .eq('event_id', event.id)
      .ilike('team_code', 'playon%');
      
    console.log("Teams length:", teams?.length, teamsErr?.message);
    if (teams && teams.length > 0) {
      console.log("First team name:", teams[0].team_name);
    }
  }
}

test();
