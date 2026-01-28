import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://ohjgplnomwejeygtnlmz.supabase.co',
    'sb_publishable_05rGM2nM7MA_RrCsGoWVWg_c01y7Ok0'
)

// Sertralina doses from spreadsheet (started Jan 13)
const sertralinaByDate = {
    '2026-01-13': 20, '2026-01-14': 21, '2026-01-15': 22, '2026-01-16': 23,
    '2026-01-17': 24, '2026-01-18': 25, '2026-01-19': 26, '2026-01-20': 40,
    '2026-01-21': 41, '2026-01-22': 42, '2026-01-23': 43, '2026-01-24': 44,
    '2026-01-25': 45, '2026-01-26': 46, '2026-01-27': 60, '2026-01-28': 61,
    '2026-01-29': 62, '2026-01-30': 63, '2026-01-31': 64
}

async function populateJanuaryData() {
    console.log('Populating January 2026 medication data...')

    // Check existing entries first
    const { data: existing, error: fetchError } = await supabase
        .from('daily_entries')
        .select('entry_date')
        .gte('entry_date', '2026-01-01')
        .lte('entry_date', '2026-01-31')

    if (fetchError) {
        console.error('Error fetching:', fetchError)
        return
    }

    const existingDates = new Set(existing?.map(e => e.entry_date) || [])
    console.log('Existing entries:', existingDates.size)

    const entries = []

    for (let day = 1; day <= 31; day++) {
        const dateStr = `2026-01-${String(day).padStart(2, '0')}`

        // Skip if entry already exists
        if (existingDates.has(dateStr)) {
            console.log(`Skipping ${dateStr} - already exists`)
            continue
        }

        const sertralinaQty = sertralinaByDate[dateStr] || 0

        // Build medication taken object based on the spreadsheet
        // med IDs: 1=Artane, 2=Rivotril, 3=Sertralina, 4=Metibasol, 5=Atorvastatina
        const medicationsTaken = {
            // Artane: 1 manhã, 1 tarde
            1: {
                manha: { active: true, hour: '08', qty: 1, timing: 'depois' },
                tarde: { active: true, hour: '13', qty: 1, timing: 'depois' }
            },
            // Rivotril: 1 manhã, 1.5 tarde, 3 noite
            2: {
                manha: { active: true, hour: '08', qty: 1, timing: 'depois' },
                tarde: { active: true, hour: '13', qty: 1.5, timing: 'depois' },
                noite: { active: true, hour: '22', qty: 3, timing: 'antes' }
            },
            // Metibasol: 1 tarde
            4: {
                tarde: { active: true, hour: '13', qty: 1, timing: 'depois' }
            },
            // Atorvastatina: 1 noite
            5: {
                noite: { active: true, hour: '22', qty: 1, timing: 'antes' }
            }
        }

        // Add Sertralina if started (from Jan 13)
        if (sertralinaQty > 0) {
            medicationsTaken[3] = {
                noite: { active: true, hour: '22', qty: sertralinaQty, timing: 'depois' }
            }
        }

        entries.push({
            entry_date: dateStr,
            medications_taken: medicationsTaken,
            notes: `Dados importados do mapa cronológico. ${sertralinaQty > 0 ? `Sertralina: ${sertralinaQty} gotas.` : ''}`
        })
    }

    if (entries.length === 0) {
        console.log('No new entries to insert.')
        return
    }

    console.log(`Inserting ${entries.length} entries...`)

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

populateJanuaryData()
