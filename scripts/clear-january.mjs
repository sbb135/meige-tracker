import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://ohjgplnomwejeygtnlmz.supabase.co',
    'sb_publishable_05rGM2nM7MA_RrCsGoWVWg_c01y7Ok0'
)

async function clearJanuaryData() {
    console.log('Clearing all January data to restore app functionality...')

    const { error } = await supabase
        .from('daily_entries')
        .delete()
        .gte('entry_date', '2026-01-01')
        .lte('entry_date', '2026-01-27')

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('January data cleared. App should work now.')
    }
}

clearJanuaryData()
