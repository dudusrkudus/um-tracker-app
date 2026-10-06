require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('runners')
    .select('id, full_name, tracking_token_hash, telegram_pairing_code')
    .eq('tracking_token_hash', 'IAMH6LH2');
    
  console.log('Search by token:', data);
  
  if (data && data.length > 0) {
    const runner = data[0];
    const newCode = 'TEST1234';
    await supabase.from('runners').update({ telegram_pairing_code: newCode }).eq('id', runner.id);
    console.log(`Updated runner ${runner.full_name} with pairing code: ${newCode}`);
  } else {
    // just update any runner for testing
    const { data: anyData } = await supabase.from('runners').select('*').limit(1);
    if(anyData && anyData.length > 0) {
      await supabase.from('runners').update({ telegram_pairing_code: 'TEST1234' }).eq('id', anyData[0].id);
      console.log(`Updated ANY runner ${anyData[0].full_name} with pairing code TEST1234`);
    }
  }
}

run();
