import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://ohjgplnomwejeygtnlmz.supabase.co',
    'sb_publishable_05rGM2nM7MA_RrCsGoWVWg_c01y7Ok0'
)

async function fixData() {
    console.log('Deleting future entries (Jan 29-31) and all January data to fix format...')

    // Delete all January entries to start fresh (the format was wrong)
    const { error: delError } = await supabase
        .from('daily_entries')
        .delete()
        .gte('entry_date', '2026-01-01')
        .lte('entry_date', '2026-01-31')

    if (delError) {
        console.error('Error deleting:', delError)
        return
    }

    console.log('Deleted January entries. Re-inserting with correct format...')

    // Sertralina doses from spreadsheet (started Jan 13)
    const sertralinaByDate = {
        '2026-01-13': 20, '2026-01-14': 21, '2026-01-15': 22, '2026-01-16': 23,
        '2026-01-17': 24, '2026-01-18': 25, '2026-01-19': 26, '2026-01-20': 40,
        '2026-01-21': 41, '2026-01-22': 42, '2026-01-23': 43, '2026-01-24': 44,
        '2026-01-25': 45, '2026-01-26': 46, '2026-01-27': 60
    }

    const entries = []

    // Only Jan 1-27 (not 28 which is today, not future dates)
    for (let day = 1; day <= 27; day++) {
        const dateStr = `2026-01-${String(day).padStart(2, '0')}`
        const sertralinaQty = sertralinaByDate[dateStr] || 0

        // Build medication taken object - using STRING keys to match what JavaScript expects
        const medicationsTaken = {
            "1": {  // Artane
                "manha": { "active": true, "hour": "08", "qty": 1, "timing": "depois" },
                "tarde": { "active": true, "hour": "13", "qty": 1, "timing": "depois" }
            },
            "2": {  // Rivotril - 1 manhã, 1.5 tarde, 3 noite 
                "manha": { "active": true, "hour": "08", "qty": 1, "timing": "depois" },
                "tarde": { "active": true, "hour": "13", "qty": 1.5, "timing": "depois" },
                "noite": { "active": true, "hour": "22", "qty": 3, "timing": "antes" }
            },
            "4": {  // Metibasol
                "tarde": { "active": true, "hour": "13", "qty": 1, "timing": "depois" }
            },
            "5": {  // Atorvastatina
                "noite": { "active": true, "hour": "22", "qty": 1, "timing": "antes" }
            }
        }

        // Add Sertralina if started (from Jan 13)
        if (sertralinaQty > 0) {
            medicationsTaken["3"] = {
                "noite": { "active": true, "hour": "22", "qty": sertralinaQty, "timing": "depois" }
            }
        }

        entries.push({
            entry_date: dateStr,
            medications_taken: medicationsTaken,
            notes: `Dados importados do mapa cronológico. ${sertralinaQty > 0 ? `Sertralina: ${sertralinaQty} gotas.` : ''}`
        })
    }

    console.log(`Inserting ${entries.length} entries (Jan 1-27)...`)

    const { data, error } = await supabase
        .from('daily_entries')
        .insert(entries)
        .select()

    if (error) {
        console.error('Error inserting:', error)
    } else {
        console.log(`Successfully inserted ${data?.length || 0} entries!`)
    }
}

fixData()
