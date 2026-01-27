import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from './supabase';

const MeigeTracker = () => {
  const [currentView, setCurrentView] = useState('calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMedicationSetup, setShowMedicationSetup] = useState(false);
  const [showBotoxForm, setShowBotoxForm] = useState(false);
  const [showConsultaForm, setShowConsultaForm] = useState(false);
  const [editingBotoxId, setEditingBotoxId] = useState(null);

  // Horários de refeição
  const mealTimes = [
    { id: 'pequeno_almoco', label: 'Pequeno-almoço', defaultHour: '08:00' },
    { id: 'almoco', label: 'Almoço', defaultHour: '13:00' },
    { id: 'lanche', label: 'Lanche', defaultHour: '16:00' },
    { id: 'jantar', label: 'Jantar', defaultHour: '20:00' },
    { id: 'deitar', label: 'Ao deitar', defaultHour: '22:30' },
  ];

  // Tipos de consulta
  const tiposConsulta = ['Neurologista', 'Médica de família', 'Dentista', 'Oftalmologista', 'Fisioterapeuta', 'Psicólogo', 'Outro'];

  // Consultas
  const [consultas, setConsultas] = useState([]);
  const [editingConsultaId, setEditingConsultaId] = useState(null);
  const [newConsulta, setNewConsulta] = useState({
    date: new Date().toISOString().split('T')[0],
    tipo: 'Neurologista',
    medico: '',
    clinica: '',
    motivo: '',
    notas: '',
    proximaConsulta: ''
  });

  // Medicamentos
  const [medications, setMedications] = useState([
    {
      id: 1, name: 'Rivotril', dosePerPill: '0,5', unit: 'mg', times: {
        pequeno_almoco: { qty: 1, hour: '08:00', timing: 'depois' },
        lanche: { qty: 1.5, hour: '16:00', timing: 'depois' },
        deitar: { qty: 3, hour: '22:30', timing: 'antes' }
      }
    },
    {
      id: 2, name: 'Artane', dosePerPill: '2', unit: 'mg', times: {
        pequeno_almoco: { qty: 1, hour: '08:00', timing: 'depois' },
        lanche: { qty: 1, hour: '16:00', timing: 'depois' }
      }
    },
    {
      id: 3, name: 'Metibasol', dosePerPill: '5', unit: 'mg', times: {
        almoco: { qty: 1, hour: '13:00', timing: 'depois' }
      }
    },
    {
      id: 4, name: 'Gotas antidepressivas', dosePerPill: '', unit: 'gotas', times: {
        deitar: { qty: 10, hour: '22:00', timing: 'antes' }
      }
    },
  ]);

  const [entries, setEntries] = useState({});
  const [botoxRecords, setBotoxRecords] = useState([]);

  // Locais de injecção de Botox para Síndrome de Meige - groupados por condição clínica
  const botoxSites = [
    // Blefarospasmo - músculos periorbitais
    { id: 'orbicular_sup_esq', name: 'Pálpebra superior esquerda', group: 'Blefarospasmo' },
    { id: 'orbicular_sup_dir', name: 'Pálpebra superior direita', group: 'Blefarospasmo' },
    { id: 'orbicular_inf_esq', name: 'Pálpebra inferior esquerda', group: 'Blefarospasmo' },
    { id: 'orbicular_inf_dir', name: 'Pálpebra inferior direita', group: 'Blefarospasmo' },
    { id: 'sobrancelha_esq', name: 'Sobrancelha esquerda (corrugador)', group: 'Blefarospasmo' },
    { id: 'sobrancelha_dir', name: 'Sobrancelha direita (corrugador)', group: 'Blefarospasmo' },
    { id: 'procerus', name: 'Prócerus', group: 'Blefarospasmo' },
    // Distonia Oromandibular - músculos da mandíbula
    { id: 'masseter_esq', name: 'Masseter esquerdo', group: 'Distonia Oromandibular' },
    { id: 'masseter_dir', name: 'Masseter direito', group: 'Distonia Oromandibular' },
    { id: 'temporal_esq', name: 'Temporal esquerdo', group: 'Distonia Oromandibular' },
    { id: 'temporal_dir', name: 'Temporal direito', group: 'Distonia Oromandibular' },
    { id: 'pterigoideu_esq', name: 'Pterigoideu lateral esquerdo', group: 'Distonia Oromandibular' },
    { id: 'pterigoideu_dir', name: 'Pterigoideu lateral direito', group: 'Distonia Oromandibular' },
    { id: 'orbicular_boca', name: 'Orbicular da boca', group: 'Distonia Oromandibular' },
    { id: 'mento', name: 'Mento (queixo)', group: 'Distonia Oromandibular' },
    { id: 'digastrico', name: 'Digástrico', group: 'Distonia Oromandibular' },
    // Distonia Cervical - músculos do pescoço (se aplicável)
    { id: 'esternocleidomastoideo_esq', name: 'Esternocleidomastóideo esquerdo', group: 'Pescoço' },
    { id: 'esternocleidomastoideo_dir', name: 'Esternocleidomastóideo direito', group: 'Pescoço' },
    { id: 'trapezio_esq', name: 'Trapézio esquerdo', group: 'Pescoço' },
    { id: 'trapezio_dir', name: 'Trapézio direito', group: 'Pescoço' },
  ];

  // Nova entrada de Botox
  const [newBotox, setNewBotox] = useState({
    date: new Date().toISOString().split('T')[0],
    totalDose: '',
    sites: {},
    doctor: '',
    clinic: '',
    notes: ''
  });

  // Entrada do dia
  const getDefaultDayEntry = () => ({
    // Sono
    bedTime: '',
    wakeTime: '',
    sleepInterruptions: 0,
    sleepQuality: '',
    feltRested: '',

    // Ao acordar
    wakeEyes: 0,
    wakeFace: 0,
    wakeEmotion: '',
    wakeStabilizeTime: '',
    wakeCrying: false,

    // Manhã
    morningEyes: 0,
    morningFace: 0,
    morningSpeech: '',
    morningEating: '',

    // Tarde
    afternoonEyes: 0,
    afternoonFace: 0,
    afternoonSpeech: '',
    afternoonEating: '',

    // Noite
    eveningEyes: 0,
    eveningFace: 0,
    eveningSpeech: '',
    eveningEating: '',

    // Período bom
    hadGoodPeriod: false,
    goodPeriodDuration: '',
    goodPeriodWhen: '',

    // Triggers
    triggers: {
      stress: false,
      tiredness: false,
      brightLight: false,
      caffeine: false,
      socialSituation: false,
      other: ''
    },

    // Humor
    sadnessNoReason: false,
    cryingEpisodes: 0,
    irritability: false,
    anxiety: '',

    // Funcionalidade
    leftHouse: '',
    normalTasks: '',
    neededHelp: false,

    // Medicação
    medicationsTaken: {},
    medicationNotes: '',

    // Efeitos secundários
    sideEffects: {
      dryMouth: false,
      confusion: false,
      dizziness: false,
      other: ''
    },

    // Botox
    botoxEffect: '',

    // Notas
    notes: ''
  });

  const [dayEntry, setDayEntry] = useState(getDefaultDayEntry());

  // Load all data from Supabase on startup
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load entries
        const { data: entriesData } = await supabase.from('daily_entries').select('*');
        if (entriesData) {
          const entriesObj = {};
          entriesData.forEach(e => {
            entriesObj[e.entry_date] = {
              bedTime: e.bed_time,
              wakeTime: e.wake_time,
              sleepQuality: e.sleep_quality,
              wakeEyes: e.wake_eyes,
              wakeFace: e.wake_face,
              morningEyes: e.morning_eyes,
              morningFace: e.morning_face,
              morningSpeech: e.morning_speech,
              morningEating: e.morning_eating,
              afternoonEyes: e.afternoon_eyes,
              afternoonFace: e.afternoon_face,
              afternoonSpeech: e.afternoon_speech,
              afternoonEating: e.afternoon_eating,
              eveningEyes: e.evening_eyes,
              eveningFace: e.evening_face,
              eveningSpeech: e.evening_speech,
              eveningEating: e.evening_eating,
              triggers: e.triggers || {},
              normalTasks: e.normal_tasks,
              cryingEpisodes: e.crying_episodes,
              medicationsTaken: e.medications_taken || {},
              notes: e.notes
            };
          });
          setEntries(entriesObj);
        }

        // Load medications
        const { data: medsData } = await supabase.from('medications').select('*').order('id', { ascending: false }).limit(1);
        if (medsData && medsData.length > 0) {
          setMedications(medsData[0].data);
        }

        // Load botox records
        const { data: botoxData } = await supabase.from('botox_injections').select('*');
        if (botoxData) {
          setBotoxRecords(botoxData.map(b => ({
            id: b.id,
            date: b.injection_date,
            totalDose: b.total_dose,
            sites: b.sites || {},
            doctor: b.doctor,
            clinic: b.clinic,
            notes: b.notes
          })));
        }

        // Load consultas (appointments table)
        const { data: consultasData } = await supabase.from('appointments').select('*');
        if (consultasData) {
          setConsultas(consultasData.map(c => ({
            id: c.id,
            date: c.appointment_date,
            tipo: c.specialty,
            medico: c.doctor,
            clinica: c.clinic,
            notas: c.notes,
            proximaConsulta: c.next_appointment_date || ''
          })));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Update dayEntry when selectedDate or entries change
  useEffect(() => {
    if (entries[selectedDate]) {
      setDayEntry(entries[selectedDate]);
    } else {
      const defaultMeds = {};
      medications.forEach(med => {
        defaultMeds[med.id] = {};
        Object.entries(med.times).forEach(([time, config]) => {
          defaultMeds[med.id][time] = {
            qty: config.qty,
            hour: config.hour,
            taken: true
          };
        });
      });
      setDayEntry({
        ...getDefaultDayEntry(),
        medicationsTaken: defaultMeds
      });
    }
  }, [selectedDate, entries, medications]);

  // Guardar entrada
  const saveEntry = async () => {
    setIsSaving(true);
    try {
      // Upsert to Supabase (insert or update)
      await supabase.from('daily_entries').upsert({
        entry_date: selectedDate,
        bed_time: dayEntry.bedTime,
        wake_time: dayEntry.wakeTime,
        sleep_quality: dayEntry.sleepQuality,
        wake_eyes: dayEntry.wakeEyes,
        wake_face: dayEntry.wakeFace,
        morning_eyes: dayEntry.morningEyes,
        morning_face: dayEntry.morningFace,
        morning_speech: dayEntry.morningSpeech,
        morning_eating: dayEntry.morningEating,
        afternoon_eyes: dayEntry.afternoonEyes,
        afternoon_face: dayEntry.afternoonFace,
        afternoon_speech: dayEntry.afternoonSpeech,
        afternoon_eating: dayEntry.afternoonEating,
        evening_eyes: dayEntry.eveningEyes,
        evening_face: dayEntry.eveningFace,
        evening_speech: dayEntry.eveningSpeech,
        evening_eating: dayEntry.eveningEating,
        triggers: dayEntry.triggers,
        normal_tasks: dayEntry.normalTasks,
        crying_episodes: dayEntry.cryingEpisodes,
        medications_taken: dayEntry.medicationsTaken,
        notes: dayEntry.notes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'entry_date' });

      setEntries(prev => ({
        ...prev,
        [selectedDate]: dayEntry
      }));
    } catch (error) {
      console.error('Error saving entry:', error);
    }
    setIsSaving(false);
    setCurrentView('calendar');
  };

  // Calcular horas de sono
  const calculateSleepHours = () => {
    if (!dayEntry.bedTime || !dayEntry.wakeTime) return '-';
    const [bedH, bedM] = dayEntry.bedTime.split(':').map(Number);
    const [wakeH, wakeM] = dayEntry.wakeTime.split(':').map(Number);
    let hours = wakeH - bedH;
    let mins = wakeM - bedM;
    if (hours < 0) hours += 24;
    if (mins < 0) { mins += 60; hours -= 1; }
    return `${hours}h ${mins}m`;
  };

  // Dias desde último Botox (retorna objeto com dias e formato meses+dias)
  const daysSinceBotox = () => {
    if (botoxRecords.length === 0) return null;
    const sorted = [...botoxRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastBotox = new Date(sorted[0].date);
    const today = new Date();
    const totalDays = Math.floor((today - lastBotox) / (1000 * 60 * 60 * 24));
    return totalDays;
  };

  // Formatar dias em meses e dias
  const formatDaysAsMonths = (days) => {
    if (days === null) return '';
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (months === 0) return `${days}d`;
    if (remainingDays === 0) return `${months}m`;
    return `${months}m ${remainingDays}d`;
  };

  // Guardar ou atualizar Botox
  const saveBotoxRecord = async () => {
    try {
      if (editingBotoxId) {
        // Update existing
        const { error } = await supabase.from('botox_injections').update({
          injection_date: newBotox.date,
          total_dose: newBotox.totalDose,
          sites: newBotox.sites,
          doctor: newBotox.doctor,
          clinic: newBotox.clinic,
          notes: newBotox.notes
        }).eq('id', editingBotoxId);
        if (error) {
          alert('❌ Erro ao atualizar: ' + error.message);
          return;
        }
        setBotoxRecords(prev => prev.map(b => b.id === editingBotoxId ? { ...newBotox, id: editingBotoxId } : b));
        alert('✅ Registo de Botox atualizado!');
        setEditingBotoxId(null);
      } else {
        // Insert new
        const { data, error } = await supabase.from('botox_injections').insert({
          injection_date: newBotox.date,
          total_dose: newBotox.totalDose,
          sites: newBotox.sites,
          doctor: newBotox.doctor,
          clinic: newBotox.clinic,
          notes: newBotox.notes
        }).select();
        if (error) {
          alert('❌ Erro ao guardar: ' + error.message);
          return;
        }
        if (data && data[0]) {
          setBotoxRecords(prev => [...prev, { ...newBotox, id: data[0].id }]);
          alert('✅ Registo de Botox guardado!');
        }
      }
    } catch (error) {
      console.error('Error saving botox record:', error);
      alert('❌ Erro ao guardar');
    }
    setNewBotox({
      date: new Date().toISOString().split('T')[0],
      totalDose: '',
      sites: {},
      doctor: '',
      clinic: '',
      notes: ''
    });
    setShowBotoxForm(false);
  };

  // Guardar ou atualizar consulta
  const saveConsulta = async () => {
    try {
      if (editingConsultaId) {
        // Update existing
        const { error } = await supabase.from('appointments').update({
          appointment_date: newConsulta.date,
          specialty: newConsulta.tipo,
          doctor: newConsulta.medico,
          clinic: newConsulta.clinica,
          notes: newConsulta.notas,
          next_appointment_date: newConsulta.proximaConsulta || null
        }).eq('id', editingConsultaId);
        if (error) {
          alert('❌ Erro ao atualizar consulta: ' + error.message);
          return;
        }
        setConsultas(prev => prev.map(c => c.id === editingConsultaId ? { ...newConsulta, id: editingConsultaId } : c));
        alert('✅ Consulta atualizada!');
        setEditingConsultaId(null);
      } else {
        // Insert new
        const { data, error } = await supabase.from('appointments').insert({
          appointment_date: newConsulta.date,
          specialty: newConsulta.tipo,
          doctor: newConsulta.medico,
          clinic: newConsulta.clinica,
          notes: newConsulta.notas,
          next_appointment_date: newConsulta.proximaConsulta || null
        }).select();
        if (error) {
          alert('❌ Erro ao guardar consulta: ' + error.message);
          return;
        }
        if (data && data[0]) {
          setConsultas(prev => [...prev, { ...newConsulta, id: data[0].id }]);
          alert('✅ Consulta guardada!');
        }
      }
    } catch (error) {
      console.error('Error saving consulta:', error);
      alert('❌ Erro ao guardar consulta');
    }
    setNewConsulta({
      date: new Date().toISOString().split('T')[0],
      tipo: 'Neurologista',
      medico: '',
      clinica: '',
      motivo: '',
      notas: '',
      proximaConsulta: ''
    });
    setShowConsultaForm(false);
  };

  // Formatar data em português
  const formatDatePT = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
  };

  // Preparar dados para gráficos
  const prepareChartData = () => {
    const sortedDates = Object.keys(entries).sort();
    return sortedDates.map(date => {
      const entry = entries[date];
      const [y, m, d] = date.split('-');
      return {
        date: `${d}/${m}`,
        mediaOlhos: ((entry.wakeEyes || 0) + (entry.morningEyes || 0) + (entry.afternoonEyes || 0) + (entry.eveningEyes || 0)) / 4,
        mediaFace: ((entry.wakeFace || 0) + (entry.morningFace || 0) + (entry.afternoonFace || 0) + (entry.eveningFace || 0)) / 4,
        choro: entry.cryingEpisodes || 0,
      };
    });
  };

  // Calcular triggers mais frequentes
  const getTriggersData = () => {
    const counts = { stress: 0, tiredness: 0, brightLight: 0, caffeine: 0, socialSituation: 0 };
    const labels = { stress: 'Stress', tiredness: 'Cansaço', brightLight: 'Luz forte', caffeine: 'Cafeína', socialSituation: 'Situação social' };
    Object.values(entries).forEach(entry => {
      if (entry.triggers) Object.keys(counts).forEach(key => { if (entry.triggers[key]) counts[key]++; });
    });
    return Object.entries(counts).filter(([_, c]) => c > 0).map(([key, count]) => ({ name: labels[key], value: count }));
  };

  // Renderizar calendário
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasEntry = entries[dateStr];
      const hasBotox = botoxRecords.some(b => b.date === dateStr);
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      let bgClass = 'bg-slate-700';
      if (hasEntry) {
        const avgSymptoms = (
          (hasEntry.morningEyes || 0) + (hasEntry.afternoonEyes || 0) + (hasEntry.eveningEyes || 0) +
          (hasEntry.morningFace || 0) + (hasEntry.afternoonFace || 0) + (hasEntry.eveningFace || 0)
        ) / 6;
        if (avgSymptoms <= 2) bgClass = 'bg-sky-800';
        else if (avgSymptoms <= 5) bgClass = 'bg-slate-600';
        else bgClass = 'bg-slate-500';
      }

      days.push(
        <div
          key={day}
          onClick={() => {
            setSelectedDate(dateStr);
            setCurrentView('entry');
          }}
          className={`relative rounded-lg p-2 min-h-14 cursor-pointer transition-all
                     ${bgClass} ${isSelected ? 'ring-2 ring-sky-400' : ''} 
                     ${isToday ? 'ring-2 ring-sky-300' : ''}
                     hover:ring-2 hover:ring-sky-400`}
        >
          <span className={`text-sm ${isToday ? 'text-sky-300 font-semibold' : 'text-slate-200'}`}>
            {day}
          </span>
          {hasBotox && (
            <span className="absolute bottom-1 right-1 text-xs text-sky-300">BTX</span>
          )}
          {hasEntry && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-sky-400 rounded-full"></span>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1))}
            className="p-3 hover:bg-slate-700 rounded-lg text-slate-300"
          >
            Anterior
          </button>
          <h2 className="text-xl font-semibold text-slate-100">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1))}
            className="p-3 hover:bg-slate-700 rounded-lg text-slate-300"
          >
            Seguinte
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(d => (
            <div key={d} className="text-center text-sm font-medium text-slate-400 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>

        <div className="mt-6 p-4 bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-400 mb-2">Legenda:</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-sky-800 rounded"></div>
              <span>Dia bom (0-2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-600 rounded"></div>
              <span>Dia moderado (3-5)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-500 rounded"></div>
              <span>Dia difícil (6-10)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sky-300 text-xs">BTX</span>
              <span>Botox</span>
            </div>
          </div>
        </div>

        {daysSinceBotox() !== null && (
          <div className="mt-4 p-4 bg-slate-800 rounded-lg text-center">
            <p className="text-slate-400 text-sm">Tempo desde última injecção de Botox</p>
            <p className="text-3xl font-bold text-sky-400 mt-1">{formatDaysAsMonths(daysSinceBotox())}</p>
            <p className="text-slate-500 text-sm">({daysSinceBotox()} dias)</p>
            {daysSinceBotox() > 90 && (
              <p className="text-amber-400 text-sm mt-2">Mais de 3 meses desde a última injecção</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Componente Slider
  const SymptomSlider = ({ label, value, onChange, description }) => (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <label className="font-medium text-slate-200">{label}</label>
        <span className={`text-lg font-bold ${value <= 2 ? 'text-sky-400' : value <= 5 ? 'text-slate-300' : 'text-slate-100'
          }`}>{value}/10</span>
      </div>
      {description && <p className="text-sm text-slate-400 mb-2">{description}</p>}
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-600"
        style={{
          background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${value * 10}%, #475569 ${value * 10}%, #475569 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>Sem espasmos</span>
        <span>Muito forte</span>
      </div>
    </div>
  );

  // Componente Select
  const SelectField = ({ label, value, onChange, options, description }) => (
    <div className="mb-5">
      <label className="block font-medium text-slate-200 mb-2">{label}</label>
      {description && <p className="text-sm text-slate-400 mb-2">{description}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${value === opt.value
              ? 'bg-sky-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  // Componente Checkbox
  const CheckboxField = ({ label, checked, onChange }) => (
    <div className="flex items-center gap-3 mb-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500"
      />
      <label className="text-slate-300">{label}</label>
    </div>
  );

  // Renderizar formulário
  const renderEntryForm = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView('calendar')}
            className="text-sky-400 hover:text-sky-300"
          >
            Voltar ao calendário
          </button>
          <h2 className="text-lg font-semibold text-slate-100">{formatDatePT(selectedDate)}</h2>
        </div>

        {/* SONO */}
        <section className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
            Sono
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Hora de deitar</label>
              <div className="flex gap-2">
                <select
                  value={dayEntry.bedTime?.split(':')[0] || '22'}
                  onChange={(e) => {
                    const mins = dayEntry.bedTime?.split(':')[1] || '00';
                    setDayEntry({ ...dayEntry, bedTime: `${e.target.value}:${mins}` });
                  }}
                  className="flex-1 p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:ring-2 focus:ring-sky-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>{i}h</option>
                  ))}
                </select>
                <select
                  value={dayEntry.bedTime?.split(':')[1] || '00'}
                  onChange={(e) => {
                    const hours = dayEntry.bedTime?.split(':')[0] || '22';
                    setDayEntry({ ...dayEntry, bedTime: `${hours}:${e.target.value}` });
                  }}
                  className="w-20 p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:ring-2 focus:ring-sky-500"
                >
                  {['00', '15', '30', '45'].map(m => (
                    <option key={m} value={m}>{m}m</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Hora de acordar</label>
              <div className="flex gap-2">
                <select
                  value={dayEntry.wakeTime?.split(':')[0] || '07'}
                  onChange={(e) => {
                    const mins = dayEntry.wakeTime?.split(':')[1] || '00';
                    setDayEntry({ ...dayEntry, wakeTime: `${e.target.value}:${mins}` });
                  }}
                  className="flex-1 p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:ring-2 focus:ring-sky-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>{i}h</option>
                  ))}
                </select>
                <select
                  value={dayEntry.wakeTime?.split(':')[1] || '00'}
                  onChange={(e) => {
                    const hours = dayEntry.wakeTime?.split(':')[0] || '07';
                    setDayEntry({ ...dayEntry, wakeTime: `${hours}:${e.target.value}` });
                  }}
                  className="w-20 p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:ring-2 focus:ring-sky-500"
                >
                  {['00', '15', '30', '45'].map(m => (
                    <option key={m} value={m}>{m}m</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-3 mb-4 text-center">
            <span className="text-slate-400">Total de sono: </span>
            <span className="font-bold text-sky-400">{calculateSleepHours()}</span>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Acordou durante a noite quantas vezes?</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setDayEntry({ ...dayEntry, sleepInterruptions: n })}
                  className={`w-10 h-10 rounded-lg ${dayEntry.sleepInterruptions === n
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  {n === 5 ? '5+' : n}
                </button>
              ))}
            </div>
          </div>

          <SelectField
            label="Qualidade do sono"
            value={dayEntry.sleepQuality}
            onChange={(v) => setDayEntry({ ...dayEntry, sleepQuality: v })}
            options={[
              { value: 'adormeceu_facil', label: 'Adormeceu fácil' },
              { value: 'demorou', label: 'Demorou a adormecer' },
              { value: 'muito_dificil', label: 'Muito difícil adormecer' },
            ]}
          />

          <SelectField
            label="Acordou descansada?"
            value={dayEntry.feltRested}
            onChange={(v) => setDayEntry({ ...dayEntry, feltRested: v })}
            options={[
              { value: 'sim', label: 'Sim, descansada' },
              { value: 'mais_menos', label: 'Mais ou menos' },
              { value: 'cansada', label: 'Cansada' },
              { value: 'exausta', label: 'Muito cansada' },
            ]}
          />
        </section>

        {/* AO ACORDAR */}
        <section className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
            Ao acordar (primeiros 30 minutos)
          </h3>

          <SymptomSlider
            label="Olhos (blefarospasmo)"
            value={dayEntry.wakeEyes}
            onChange={(v) => setDayEntry({ ...dayEntry, wakeEyes: v })}
            description="0 = Sem espasmos | 10 = Olhos fecham involuntariamente"
          />

          <SymptomSlider
            label="Mandíbula"
            value={dayEntry.wakeFace}
            onChange={(v) => setDayEntry({ ...dayEntry, wakeFace: v })}
            description="0 = Sem tensão | 10 = Movimentos involuntários fortes"
          />

          <SelectField
            label="Estado emocional ao acordar"
            value={dayEntry.wakeEmotion}
            onChange={(v) => setDayEntry({ ...dayEntry, wakeEmotion: v })}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'alguma_tristeza', label: 'Alguma tristeza' },
              { value: 'choro_facil', label: 'Choro fácil' },
              { value: 'muita_ansiedade', label: 'Muita ansiedade' },
            ]}
          />

          <CheckboxField
            label="Chorou ao acordar"
            checked={dayEntry.wakeCrying}
            onChange={(v) => setDayEntry({ ...dayEntry, wakeCrying: v })}
          />

          <SelectField
            label="Quanto tempo até estabilizar?"
            value={dayEntry.wakeStabilizeTime}
            onChange={(v) => setDayEntry({ ...dayEntry, wakeStabilizeTime: v })}
            options={[
              { value: 'imediato', label: 'Imediato' },
              { value: '15min', label: '15 minutos' },
              { value: '30min', label: '30 minutos' },
              { value: '1hora', label: '1 hora' },
              { value: 'manha_toda', label: 'Manhã toda' },
              { value: 'nao_estabilizou', label: 'Não estabilizou' },
            ]}
          />
        </section>

        {/* MANHÃ */}
        <section className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
            Manhã
          </h3>

          <SymptomSlider
            label="Olhos"
            value={dayEntry.morningEyes}
            onChange={(v) => setDayEntry({ ...dayEntry, morningEyes: v })}
          />

          <SymptomSlider
            label="Mandíbula"
            value={dayEntry.morningFace}
            onChange={(v) => setDayEntry({ ...dayEntry, morningFace: v })}
          />

          <SelectField
            label="Fala"
            value={dayEntry.morningSpeech}
            onChange={(v) => setDayEntry({ ...dayEntry, morningSpeech: v })}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'alguma_dificuldade', label: 'Alguma dificuldade' },
              { value: 'muita_dificuldade', label: 'Muita dificuldade' },
              { value: 'nao_conseguiu', label: 'Não conseguiu falar' },
            ]}
          />

          <SelectField
            label="Comer e mastigar"
            value={dayEntry.morningEating}
            onChange={(v) => setDayEntry({ ...dayEntry, morningEating: v })}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'alguma_dificuldade', label: 'Alguma dificuldade' },
              { value: 'muita_dificuldade', label: 'Muita dificuldade' },
              { value: 'nao_conseguiu', label: 'Não conseguiu comer' },
            ]}
          />
        </section>

        {/* TARDE */}
        <section className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
            Tarde
          </h3>

          <SymptomSlider
            label="Olhos"
            value={dayEntry.afternoonEyes}
            onChange={(v) => setDayEntry({ ...dayEntry, afternoonEyes: v })}
          />

          <SymptomSlider
            label="Mandíbula"
            value={dayEntry.afternoonFace}
            onChange={(v) => setDayEntry({ ...dayEntry, afternoonFace: v })}
          />

          <SelectField
            label="Fala"
            value={dayEntry.afternoonSpeech}
            onChange={(v) => setDayEntry({ ...dayEntry, afternoonSpeech: v })}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'alguma_dificuldade', label: 'Alguma dificuldade' },
              { value: 'muita_dificuldade', label: 'Muita dificuldade' },
              { value: 'nao_conseguiu', label: 'Não conseguiu falar' },
            ]}
          />

          <SelectField
            label="Comer e mastigar"
            value={dayEntry.afternoonEating}
            onChange={(v) => setDayEntry({ ...dayEntry, afternoonEating: v })}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'alguma_dificuldade', label: 'Alguma dificuldade' },
              { value: 'muita_dificuldade', label: 'Muita dificuldade' },
              { value: 'nao_conseguiu', label: 'Não conseguiu comer' },
            ]}
          />
        </section>

        {/* NOITE */}
        <section className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
            Noite
          </h3>

          <SymptomSlider
            label="Olhos"
            value={dayEntry.eveningEyes}
            onChange={(v) => setDayEntry({ ...dayEntry, eveningEyes: v })}
          />

          <SymptomSlider
            label="Mandíbula"
            value={dayEntry.eveningFace}
            onChange={(v) => setDayEntry({ ...dayEntry, eveningFace: v })}
          />

          <SelectField
            label="Fala"
            value={dayEntry.eveningSpeech}
            onChange={(v) => setDayEntry({ ...dayEntry, eveningSpeech: v })}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'alguma_dificuldade', label: 'Alguma dificuldade' },
              { value: 'muita_dificuldade', label: 'Muita dificuldade' },
              { value: 'nao_conseguiu', label: 'Não conseguiu falar' },
            ]}
          />

          <SelectField
            label="Comer e mastigar"
            value={dayEntry.eveningEating}
            onChange={(v) => setDayEntry({ ...dayEntry, eveningEating: v })}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'alguma_dificuldade', label: 'Alguma dificuldade' },
              { value: 'muita_dificuldade', label: 'Muita dificuldade' },
              { value: 'nao_conseguiu', label: 'Não conseguiu comer' },
            ]}
          />
        </section>

        {/* PERÍODO BOM */}
        <section className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
            Período bom
          </h3>

          <CheckboxField
            label="Houve algum período bom hoje?"
            checked={dayEntry.hadGoodPeriod}
            onChange={(v) => setDayEntry({ ...dayEntry, hadGoodPeriod: v })}
          />

          {dayEntry.hadGoodPeriod && (
            <>
              <SelectField
                label="Quando foi?"
                value={dayEntry.goodPeriodWhen}
                onChange={(v) => setDayEntry({ ...dayEntry, goodPeriodWhen: v })}
                options={[
                  { value: 'manha_cedo', label: 'Manhã cedo' },
                  { value: 'manha', label: 'Manhã' },
                  { value: 'almoco', label: 'Hora de almoço' },
                  { value: 'tarde', label: 'Tarde' },
                  { value: 'fim_tarde', label: 'Fim da tarde' },
                  { value: 'noite', label: 'Noite' },
                ]}
              />

              <SelectField
                label="Quanto tempo durou?"
                value={dayEntry.goodPeriodDuration}
                onChange={(v) => setDayEntry({ ...dayEntry, goodPeriodDuration: v })}
                options={[
                  { value: '15min', label: '15 minutos' },
                  { value: '30min', label: '30 minutos' },
                  { value: '1hora', label: '1 hora' },
                  { value: '2horas', label: '2 horas' },
                  { value: 'varias_horas', label: 'Várias horas' },
                  { value: 'dia_todo', label: 'Quase o dia todo' },
                ]}
              />
            </>
          )}
        </section>

        {/* MEDICAÇÃO */}
        <section className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
            Medicação
          </h3>

          {medications.map(med => (
            <div key={med.id} className="bg-slate-700 rounded-lg p-4 mb-3">
              <div className="mb-3">
                <span className="font-medium text-slate-200">{med.name}</span>
                {med.dosePerPill && (
                  <span className="text-sm text-slate-400 ml-2">
                    ({med.dosePerPill} {med.unit} por {med.unit === 'gotas' ? 'gota' : 'comprimido'})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(med.times).map(([time, config]) => {
                  const periodLabels = {
                    pequeno_almoco: 'Manhã',
                    manha: 'Manhã',
                    almoco: 'Almoço',
                    lanche: 'Tarde',
                    tarde: 'Tarde',
                    jantar: 'Noite',
                    deitar: 'Noite',
                    noite: 'Noite'
                  };
                  const periodLabel = periodLabels[time] || time;
                  const currentHour = dayEntry.medicationsTaken?.[med.id]?.[time]?.hour ?? config.hour;
                  const currentTiming = dayEntry.medicationsTaken?.[med.id]?.[time]?.timing ?? config.timing ?? 'depois';

                  return (
                    <div key={time} className="bg-slate-600 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-200">{periodLabel}</span>
                        <button
                          onClick={() => {
                            const newMeds = { ...dayEntry.medicationsTaken };
                            if (!newMeds[med.id]) newMeds[med.id] = {};
                            if (!newMeds[med.id][time]) newMeds[med.id][time] = { qty: config.qty, hour: config.hour, taken: true, timing: currentTiming };
                            newMeds[med.id][time].taken = !newMeds[med.id][time].taken;
                            setDayEntry({ ...dayEntry, medicationsTaken: newMeds });
                          }}
                          className={`px-3 py-1 rounded text-sm ${dayEntry.medicationsTaken?.[med.id]?.[time]?.taken !== false
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-500 text-slate-300'
                            }`}
                        >
                          {dayEntry.medicationsTaken?.[med.id]?.[time]?.taken !== false ? 'Tomou' : 'Não tomou'}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 mb-1">Hora</label>
                          <div className="flex gap-1">
                            <select
                              value={(dayEntry.medicationsTaken?.[med.id]?.[time]?.hour ?? config.hour)?.split(':')[0] || '08'}
                              onChange={(e) => {
                                const newMeds = { ...dayEntry.medicationsTaken };
                                if (!newMeds[med.id]) newMeds[med.id] = {};
                                const currentHourVal = dayEntry.medicationsTaken?.[med.id]?.[time]?.hour ?? config.hour;
                                const mins = currentHourVal?.split(':')[1] || '00';
                                if (!newMeds[med.id][time]) newMeds[med.id][time] = { qty: config.qty, hour: config.hour, taken: true, timing: currentTiming };
                                newMeds[med.id][time].hour = `${e.target.value}:${mins}`;
                                setDayEntry({ ...dayEntry, medicationsTaken: newMeds });
                              }}
                              className="flex-1 p-2 rounded bg-slate-700 border border-slate-500 text-slate-100 text-sm"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={String(i).padStart(2, '0')}>{i}h</option>
                              ))}
                            </select>
                            <select
                              value={(dayEntry.medicationsTaken?.[med.id]?.[time]?.hour ?? config.hour)?.split(':')[1] || '00'}
                              onChange={(e) => {
                                const newMeds = { ...dayEntry.medicationsTaken };
                                if (!newMeds[med.id]) newMeds[med.id] = {};
                                const currentHourVal = dayEntry.medicationsTaken?.[med.id]?.[time]?.hour ?? config.hour;
                                const hours = currentHourVal?.split(':')[0] || '08';
                                if (!newMeds[med.id][time]) newMeds[med.id][time] = { qty: config.qty, hour: config.hour, taken: true, timing: currentTiming };
                                newMeds[med.id][time].hour = `${hours}:${e.target.value}`;
                                setDayEntry({ ...dayEntry, medicationsTaken: newMeds });
                              }}
                              className="w-16 p-2 rounded bg-slate-700 border border-slate-500 text-slate-100 text-sm"
                            >
                              {['00', '15', '30', '45'].map(m => (
                                <option key={m} value={m}>{m}m</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="w-20">
                          <label className="block text-xs text-slate-400 mb-1">Qtd.</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={dayEntry.medicationsTaken?.[med.id]?.[time]?.qty ?? config.qty}
                            onChange={(e) => {
                              const newMeds = { ...dayEntry.medicationsTaken };
                              if (!newMeds[med.id]) newMeds[med.id] = {};
                              if (!newMeds[med.id][time]) newMeds[med.id][time] = { qty: config.qty, hour: config.hour, taken: true, timing: currentTiming };
                              newMeds[med.id][time].qty = parseFloat(e.target.value) || 0;
                              setDayEntry({ ...dayEntry, medicationsTaken: newMeds });
                            }}
                            className="w-full p-2 rounded bg-slate-700 border border-slate-500 text-slate-100 text-sm text-center"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Refeição</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const newMeds = { ...dayEntry.medicationsTaken };
                              if (!newMeds[med.id]) newMeds[med.id] = {};
                              if (!newMeds[med.id][time]) newMeds[med.id][time] = { qty: config.qty, hour: config.hour, taken: true, timing: 'antes' };
                              else newMeds[med.id][time].timing = 'antes';
                              setDayEntry({ ...dayEntry, medicationsTaken: newMeds });
                            }}
                            className={`flex-1 px-2 py-1 rounded text-xs ${currentTiming === 'antes'
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-500'
                              }`}
                          >
                            Antes
                          </button>
                          <button
                            onClick={() => {
                              const newMeds = { ...dayEntry.medicationsTaken };
                              if (!newMeds[med.id]) newMeds[med.id] = {};
                              if (!newMeds[med.id][time]) newMeds[med.id][time] = { qty: config.qty, hour: config.hour, taken: true, timing: 'depois' };
                              else newMeds[med.id][time].timing = 'depois';
                              setDayEntry({ ...dayEntry, medicationsTaken: newMeds });
                            }}
                            className={`flex-1 px-2 py-1 rounded text-xs ${currentTiming === 'depois'
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-500'
                              }`}
                          >
                            Depois
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-4">
            <label className="block text-sm text-slate-400 mb-1">Notas sobre medicação</label>
            <textarea
              value={dayEntry.medicationNotes}
              onChange={(e) => setDayEntry({ ...dayEntry, medicationNotes: e.target.value })}
              className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
              rows={2}
              placeholder="Atrasou? Esqueceu? Algum efeito diferente?"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm text-slate-400 mb-2">Efeitos secundários</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'dryMouth', label: 'Boca seca' },
                { key: 'confusion', label: 'Confusão' },
                { key: 'dizziness', label: 'Tonturas' },
              ].map(effect => (
                <button
                  key={effect.key}
                  onClick={() => setDayEntry({
                    ...dayEntry,
                    sideEffects: {
                      ...dayEntry.sideEffects,
                      [effect.key]: !dayEntry.sideEffects[effect.key]
                    }
                  })}
                  className={`px-3 py-2 rounded-lg text-sm ${dayEntry.sideEffects[effect.key]
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                    }`}
                >
                  {effect.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* TRIGGERS */}
        <section className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
            Possíveis triggers
          </h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'stress', label: 'Stress' },
              { key: 'tiredness', label: 'Cansaço' },
              { key: 'brightLight', label: 'Luz forte' },
              { key: 'caffeine', label: 'Cafeína' },
              { key: 'socialSituation', label: 'Situação social' },
            ].map(trigger => (
              <button
                key={trigger.key}
                onClick={() => setDayEntry({
                  ...dayEntry,
                  triggers: {
                    ...dayEntry.triggers,
                    [trigger.key]: !dayEntry.triggers[trigger.key]
                  }
                })}
                className={`px-4 py-2 rounded-lg text-sm ${dayEntry.triggers[trigger.key]
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300'
                  }`}
              >
                {trigger.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Outro trigger</label>
            <input
              type="text"
              value={dayEntry.triggers.other}
              onChange={(e) => setDayEntry({
                ...dayEntry,
                triggers: { ...dayEntry.triggers, other: e.target.value }
              })}
              className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
              placeholder="Discussão, notícia má, etc."
            />
          </div>
        </section>

        {/* HUMOR */}
        <section className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
            Humor e emoção
          </h3>

          <CheckboxField
            label="Tristeza sem motivo aparente"
            checked={dayEntry.sadnessNoReason}
            onChange={(v) => setDayEntry({ ...dayEntry, sadnessNoReason: v })}
          />

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Episódios de choro</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setDayEntry({ ...dayEntry, cryingEpisodes: n })}
                  className={`w-10 h-10 rounded-lg ${dayEntry.cryingEpisodes === n
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                    }`}
                >
                  {n === 5 ? '5+' : n}
                </button>
              ))}
            </div>
          </div>

          <CheckboxField
            label="Irritabilidade"
            checked={dayEntry.irritability}
            onChange={(v) => setDayEntry({ ...dayEntry, irritability: v })}
          />

          <SelectField
            label="Nível de ansiedade"
            value={dayEntry.anxiety}
            onChange={(v) => setDayEntry({ ...dayEntry, anxiety: v })}
            options={[
              { value: 'nenhuma', label: 'Nenhuma' },
              { value: 'ligeira', label: 'Ligeira' },
              { value: 'moderada', label: 'Moderada' },
              { value: 'forte', label: 'Forte' },
            ]}
          />
        </section>

        {/* FUNCIONALIDADE */}
        <section className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
            Funcionalidade
          </h3>

          <SelectField
            label="Conseguiu sair de casa?"
            value={dayEntry.leftHouse}
            onChange={(v) => setDayEntry({ ...dayEntry, leftHouse: v })}
            options={[
              { value: 'sim', label: 'Sim' },
              { value: 'com_dificuldade', label: 'Com dificuldade' },
              { value: 'nao', label: 'Não' },
              { value: 'nao_quis', label: 'Não quis ou precisou' },
            ]}
          />

          <SelectField
            label="Tarefas normais do dia"
            value={dayEntry.normalTasks}
            onChange={(v) => setDayEntry({ ...dayEntry, normalTasks: v })}
            options={[
              { value: 'todas', label: 'Fez todas' },
              { value: 'maioria', label: 'Fez a maioria' },
              { value: 'poucas', label: 'Fez poucas' },
              { value: 'nenhuma', label: 'Não conseguiu' },
            ]}
          />

          <CheckboxField
            label="Precisou de ajuda"
            checked={dayEntry.neededHelp}
            onChange={(v) => setDayEntry({ ...dayEntry, neededHelp: v })}
          />
        </section>

        {/* BOTOX */}
        {botoxRecords.length > 0 && (
          <section className="bg-slate-800 rounded-xl p-5 mb-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
              Efeito do Botox
            </h3>

            <div className="bg-slate-700 rounded-lg p-3 mb-4 text-center">
              <span className="text-slate-400">Tempo desde última injecção: </span>
              <span className="font-bold text-sky-400">{formatDaysAsMonths(daysSinceBotox())}</span>
              <span className="text-slate-500 text-sm ml-1">({daysSinceBotox()}d)</span>
            </div>

            <SelectField
              label="Sente que o efeito está a diminuir?"
              value={dayEntry.botoxEffect}
              onChange={(v) => setDayEntry({ ...dayEntry, botoxEffect: v })}
              options={[
                { value: 'bom', label: 'Ainda está bom' },
                { value: 'a_diminuir', label: 'A começar a diminuir' },
                { value: 'fraco', label: 'Já está fraco' },
                { value: 'sem_efeito', label: 'Quase sem efeito' },
              ]}
            />
          </section>
        )}

        {/* NOTAS */}
        <section className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
            Notas do dia
          </h3>

          <textarea
            value={dayEntry.notes}
            onChange={(e) => setDayEntry({ ...dayEntry, notes: e.target.value })}
            className="w-full p-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
            rows={4}
            placeholder="Qualquer observação importante para o médico..."
          />
        </section>

        {/* GUARDAR E ELIMINAR */}
        <div className="flex gap-3">
          <button
            onClick={saveEntry}
            className="flex-1 py-4 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-500 transition-all"
          >
            Guardar registo
          </button>
          {entries[selectedDate] && (
            <button
              onClick={async () => {
                if (confirm('Tem a certeza que quer eliminar este registo?')) {
                  const { error } = await supabase.from('daily_entries').delete().eq('entry_date', selectedDate);
                  if (error) {
                    alert('❌ Erro ao eliminar do Supabase: ' + error.message);
                  } else {
                    const newEntries = { ...entries };
                    delete newEntries[selectedDate];
                    setEntries(newEntries);
                    alert('✅ Registo eliminado do Supabase com sucesso!');
                    setCurrentView('calendar');
                  }
                }
              }}
              className="px-6 py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-500 transition-all"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    );
  };

  // Configuração de medicamentos
  const renderMedicationSetup = () => {
    const timeLabels = ['manhã', 'tarde', 'noite'];

    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">Configurar medicamentos</h2>
        <p className="text-slate-400 text-sm mb-6">
          Coloque a dose que está na caixa e quantos comprimidos toma em cada altura do dia.
        </p>

        {medications.map((med, idx) => (
          <div key={med.id} className="bg-slate-800 rounded-xl p-5 mb-4">
            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-1">Nome do medicamento</label>
              <input
                type="text"
                value={med.name}
                onChange={(e) => {
                  const newMeds = [...medications];
                  newMeds[idx].name = e.target.value;
                  setMedications(newMeds);
                }}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
                placeholder="Ex: Rivotril"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Dose por comprimido</label>
                <input
                  type="text"
                  value={med.dosePerPill}
                  onChange={(e) => {
                    const newMeds = [...medications];
                    newMeds[idx].dosePerPill = e.target.value;
                    setMedications(newMeds);
                  }}
                  className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
                  placeholder="Ex: 0,5"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Unidade</label>
                <select
                  value={med.unit}
                  onChange={(e) => {
                    const newMeds = [...medications];
                    newMeds[idx].unit = e.target.value;
                    setMedications(newMeds);
                  }}
                  className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
                >
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                  <option value="gotas">gotas</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">Quando toma</label>
              <div className="grid grid-cols-2 gap-2">
                {timeLabels.map(time => {
                  const isActive = med.times[time] !== undefined;
                  return (
                    <div
                      key={time}
                      className={`rounded-lg p-3 ${isActive ? 'bg-slate-600' : 'bg-slate-700'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => {
                            const newMeds = [...medications];
                            if (e.target.checked) {
                              newMeds[idx].times[time] = { qty: 1, hour: '08:00' };
                            } else {
                              delete newMeds[idx].times[time];
                            }
                            setMedications(newMeds);
                          }}
                          className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-sky-500"
                        />
                        <span className="text-sm capitalize text-slate-200">{time}</span>
                      </div>
                      {isActive && (
                        <div className="flex gap-2">
                          <div className="flex-1 flex gap-1">
                            <select
                              value={med.times[time].hour?.split(':')[0] || '08'}
                              onChange={(e) => {
                                const newMeds = [...medications];
                                const mins = med.times[time].hour?.split(':')[1] || '00';
                                newMeds[idx].times[time].hour = `${e.target.value}:${mins}`;
                                setMedications(newMeds);
                              }}
                              className="flex-1 p-2 rounded bg-slate-700 border border-slate-500 text-slate-100 text-sm"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={String(i).padStart(2, '0')}>{i}h</option>
                              ))}
                            </select>
                            <select
                              value={med.times[time].hour?.split(':')[1] || '00'}
                              onChange={(e) => {
                                const newMeds = [...medications];
                                const hours = med.times[time].hour?.split(':')[0] || '08';
                                newMeds[idx].times[time].hour = `${hours}:${e.target.value}`;
                                setMedications(newMeds);
                              }}
                              className="w-14 p-2 rounded bg-slate-700 border border-slate-500 text-slate-100 text-sm"
                            >
                              {['00', '15', '30', '45'].map(m => (
                                <option key={m} value={m}>{m}m</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-16">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={med.times[time].qty}
                              onChange={(e) => {
                                const newMeds = [...medications];
                                newMeds[idx].times[time].qty = parseFloat(e.target.value) || 0;
                                setMedications(newMeds);
                              }}
                              className="w-full p-2 rounded bg-slate-700 border border-slate-500 text-slate-100 text-sm text-center"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setMedications(medications.filter((_, i) => i !== idx))}
              className="mt-4 text-sm text-red-400 hover:text-red-300"
            >
              Remover medicamento
            </button>
          </div>
        ))}

        <button
          onClick={() => setMedications([...medications, {
            id: Date.now(),
            name: '',
            dosePerPill: '',
            unit: 'mg',
            times: {}
          }])}
          className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-sky-500 hover:text-sky-400 mb-4"
        >
          Adicionar medicamento
        </button>

        <button
          onClick={async () => {
            try {
              await supabase.from('medications').insert({ data: medications });
            } catch (error) {
              console.error('Error saving medications:', error);
            }
            setShowMedicationSetup(false);
          }}
          className="w-full py-4 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-500"
        >
          Guardar configuração
        </button>
      </div>
    );
  };

  // Secção Consultas
  const renderConsultas = () => (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-semibold text-slate-100 mb-6">Consultas</h2>

      {!showConsultaForm ? (
        <button onClick={() => setShowConsultaForm(true)} className="w-full py-4 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-500 mb-6">
          Registar nova consulta
        </button>
      ) : (
        <div className="bg-slate-800 rounded-xl p-5 mb-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Nova consulta</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Data</label>
              <input type="date" value={newConsulta.date} onChange={(e) => setNewConsulta({ ...newConsulta, date: e.target.value })} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Tipo</label>
              <select value={newConsulta.tipo} onChange={(e) => setNewConsulta({ ...newConsulta, tipo: e.target.value })} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100">
                {tiposConsulta.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Médico</label>
              <input type="text" value={newConsulta.medico} onChange={(e) => setNewConsulta({ ...newConsulta, medico: e.target.value })} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Clínica</label>
              <input type="text" value={newConsulta.clinica} onChange={(e) => setNewConsulta({ ...newConsulta, clinica: e.target.value })} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Motivo</label>
            <input type="text" value={newConsulta.motivo} onChange={(e) => setNewConsulta({ ...newConsulta, motivo: e.target.value })} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" placeholder="Revisão, ajuste medicação, dores..." />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Notas</label>
            <textarea value={newConsulta.notas} onChange={(e) => setNewConsulta({ ...newConsulta, notas: e.target.value })} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" rows={3} />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Próxima consulta</label>
            <input type="date" value={newConsulta.proximaConsulta} onChange={(e) => setNewConsulta({ ...newConsulta, proximaConsulta: e.target.value })} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowConsultaForm(false)} className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl">Cancelar</button>
            <button onClick={saveConsulta} className="flex-1 py-3 bg-sky-600 text-white rounded-xl">Guardar</button>
          </div>
        </div>
      )}

      {consultas.filter(c => c.proximaConsulta && new Date(c.proximaConsulta) >= new Date()).length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Próximas consultas</h3>
          {consultas.filter(c => c.proximaConsulta && new Date(c.proximaConsulta) >= new Date()).sort((a, b) => new Date(a.proximaConsulta) - new Date(b.proximaConsulta)).map(c => (
            <div key={c.id + '-prox'} className="bg-slate-700 rounded-lg p-3 mb-2">
              <div className="flex justify-between"><span className="text-slate-200">{c.tipo}</span><span className="text-sky-400">{formatDatePT(c.proximaConsulta)}</span></div>
              {c.medico && <p className="text-sm text-slate-400">{c.medico}</p>}
            </div>
          ))}
        </div>
      )}

      {consultas.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Histórico</h3>
          {[...consultas].sort((a, b) => new Date(b.date) - new Date(a.date)).map(c => (
            <div key={c.id} className="bg-slate-700 rounded-lg p-4 mb-3">
              <div className="flex justify-between items-start mb-2">
                <div><span className="text-slate-200 font-medium">{c.tipo}</span><span className="text-slate-400 text-sm ml-2">{formatDatePT(c.date)}</span></div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    setNewConsulta({
                      date: c.date,
                      tipo: c.tipo,
                      medico: c.medico || '',
                      clinica: c.clinica || '',
                      motivo: c.motivo || '',
                      notas: c.notas || '',
                      proximaConsulta: c.proximaConsulta || ''
                    });
                    setEditingConsultaId(c.id);
                    setShowConsultaForm(true);
                  }} className="text-sky-400 text-sm">Editar</button>
                  <button onClick={async () => {
                    const { error } = await supabase.from('appointments').delete().eq('id', c.id);
                    if (error) {
                      alert('❌ Erro ao eliminar: ' + error.message);
                    } else {
                      setConsultas(consultas.filter(x => x.id !== c.id));
                      alert('✅ Consulta eliminada!');
                    }
                  }} className="text-red-400 text-sm">Remover</button>
                </div>
              </div>
              {c.medico && <p className="text-sm text-slate-400">Médico: {c.medico}</p>}
              {c.clinica && <p className="text-sm text-slate-400">Local: {c.clinica}</p>}
              {c.motivo && <p className="text-sm text-slate-400">Motivo: {c.motivo}</p>}
              {c.notas && <p className="text-sm text-slate-300 mt-2 italic">{c.notas}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Secção Botox
  const renderBotoxSection = () => (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-semibold text-slate-100 mb-6">Registo de Botox</h2>

      {daysSinceBotox() !== null && (
        <div className="bg-slate-800 rounded-xl p-6 mb-6 text-center">
          <p className="text-slate-400 mb-2">Tempo desde a última injecção</p>
          <p className="text-5xl font-bold text-sky-400">{formatDaysAsMonths(daysSinceBotox())}</p>
          <p className="text-slate-500 text-sm">({daysSinceBotox()} dias)</p>
          {daysSinceBotox() > 90 && (
            <p className="mt-3 text-amber-400">Mais de 3 meses desde a última injecção</p>
          )}
        </div>
      )}

      {!showBotoxForm ? (
        <button
          onClick={() => setShowBotoxForm(true)}
          className="w-full py-4 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-500 mb-6"
        >
          Registar nova injecção
        </button>
      ) : (
        <div className="bg-slate-800 rounded-xl p-5 mb-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Nova injecção</h3>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Data</label>
            <input
              type="date"
              value={newBotox.date}
              onChange={(e) => setNewBotox({ ...newBotox, date: e.target.value })}
              className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Dose total (unidades)</label>
            <input
              type="text"
              value={newBotox.totalDose}
              onChange={(e) => setNewBotox({ ...newBotox, totalDose: e.target.value })}
              className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
              placeholder="Ex: 100U"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Locais de injecção</label>

            {['Blefarospasmo', 'Distonia Oromandibular', 'Pescoço'].map(group => (
              <div key={group} className="mb-4">
                <p className="text-xs text-slate-500 uppercase mb-2">{group}</p>
                <div className="space-y-2">
                  {botoxSites.filter(s => s.group === group).map(site => (
                    <div key={site.id} className="flex items-center gap-3 bg-slate-700 rounded-lg p-3">
                      <input
                        type="checkbox"
                        checked={newBotox.sites[site.id]?.selected || false}
                        onChange={(e) => {
                          const newSites = { ...newBotox.sites };
                          if (e.target.checked) {
                            newSites[site.id] = { selected: true, dose: '' };
                          } else {
                            delete newSites[site.id];
                          }
                          setNewBotox({ ...newBotox, sites: newSites });
                        }}
                        className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-sky-500"
                      />
                      <span className="flex-1 text-slate-200 text-sm">{site.name}</span>
                      {newBotox.sites[site.id]?.selected && (
                        <input
                          type="text"
                          value={newBotox.sites[site.id]?.dose || ''}
                          onChange={(e) => {
                            const newSites = { ...newBotox.sites };
                            newSites[site.id].dose = e.target.value;
                            setNewBotox({ ...newBotox, sites: newSites });
                          }}
                          className="w-20 p-2 rounded bg-slate-600 border border-slate-500 text-slate-100 text-sm text-center"
                          placeholder="U"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Médico</label>
              <input
                type="text"
                value={newBotox.doctor}
                onChange={(e) => setNewBotox({ ...newBotox, doctor: e.target.value })}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Clínica</label>
              <input
                type="text"
                value={newBotox.clinic}
                onChange={(e) => setNewBotox({ ...newBotox, clinic: e.target.value })}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Notas</label>
            <textarea
              value={newBotox.notes}
              onChange={(e) => setNewBotox({ ...newBotox, notes: e.target.value })}
              className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
              rows={2}
              placeholder="Como correu, se doeu, etc."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowBotoxForm(false)}
              className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600"
            >
              Cancelar
            </button>
            <button
              onClick={saveBotoxRecord}
              className="flex-1 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-500"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Histórico */}
      {botoxRecords.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Histórico</h3>
          <div className="space-y-3">
            {[...botoxRecords].sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => (
              <div key={record.id} className="bg-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-slate-100 font-medium">{formatDatePT(record.date)}</p>
                    <p className="text-slate-400 text-sm">Dose total: {record.totalDose}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setNewBotox({
                          date: record.date,
                          totalDose: record.totalDose || '',
                          sites: record.sites || {},
                          doctor: record.doctor || '',
                          clinic: record.clinic || '',
                          notes: record.notes || ''
                        });
                        setEditingBotoxId(record.id);
                        setShowBotoxForm(true);
                      }}
                      className="text-sky-400 hover:text-sky-300 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => {
                        const { error } = await supabase.from('botox_injections').delete().eq('id', record.id);
                        if (error) {
                          alert('❌ Erro ao eliminar: ' + error.message);
                        } else {
                          setBotoxRecords(botoxRecords.filter(b => b.id !== record.id));
                          alert('✅ Registo eliminado!');
                        }
                      }}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                </div>
                {Object.keys(record.sites).length > 0 && (
                  <div className="text-sm text-slate-400">
                    Locais: {Object.entries(record.sites)
                      .filter(([_, v]) => v.selected)
                      .map(([id, v]) => {
                        const site = botoxSites.find(s => s.id === id);
                        return site ? `${site.name}${v.dose ? ` (${v.dose})` : ''}` : '';
                      })
                      .join(', ')}
                  </div>
                )}
                {record.doctor && <p className="text-sm text-slate-400 mt-1">Médico: {record.doctor}</p>}
                {record.notes && <p className="text-sm text-slate-500 mt-1 italic">{record.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // State for report timeline filter
  const [reportTimeline, setReportTimeline] = useState('all');

  // Relatório com gráficos
  const renderReport = () => {
    const entryDates = Object.keys(entries).sort();

    // Filter entries based on timeline selection
    const filterByTimeline = (dates) => {
      if (reportTimeline === 'all') return dates;
      const now = new Date();
      const cutoff = new Date();
      if (reportTimeline === '7') cutoff.setDate(now.getDate() - 7);
      else if (reportTimeline === '30') cutoff.setDate(now.getDate() - 30);
      else if (reportTimeline === '90') cutoff.setDate(now.getDate() - 90);
      return dates.filter(d => new Date(d) >= cutoff);
    };

    const filteredDates = filterByTimeline(entryDates);

    // Prepare raw time-series data for correlation charts
    const timeSeriesData = filteredDates.map(date => {
      const entry = entries[date];
      const [y, m, d] = date.split('-');

      // Calculate days since last Botox
      let daysSinceBtx = null;
      if (botoxRecords.length > 0) {
        const sortedBotox = [...botoxRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
        const entryDate = new Date(date);
        for (const btx of sortedBotox) {
          if (new Date(btx.date) <= entryDate) {
            daysSinceBtx = Math.floor((entryDate - new Date(btx.date)) / (1000 * 60 * 60 * 24));
          }
        }
      }

      // Map speech values to numbers for charting
      const speechMap = { 'normal': 0, 'alguma_dificuldade': 3, 'muita_dificuldade': 7, 'nao_conseguiu': 10 };
      const eatingMap = { 'normal': 0, 'alguma_dificuldade': 3, 'muita_dificuldade': 7, 'nao_conseguiu': 10 };

      return {
        date: `${d}/${m}`,
        fullDate: date,
        olhos: entry.morningEyes || 0,
        face: entry.morningFace || 0,
        olhosTarde: entry.afternoonEyes || 0,
        faceTarde: entry.afternoonFace || 0,
        olhosNoite: entry.eveningEyes || 0,
        faceNoite: entry.eveningFace || 0,
        fala: speechMap[entry.morningSpeech] ?? null,
        comer: eatingMap[entry.morningEating] ?? null,
        falaTarde: speechMap[entry.afternoonSpeech] ?? null,
        comerTarde: eatingMap[entry.afternoonEating] ?? null,
        choro: entry.cryingEpisodes || 0,
        daysSinceBtx,
        sono: entry.bedTime && entry.wakeTime ? (() => {
          const [bedH, bedM] = entry.bedTime.split(':').map(Number);
          const [wakeH, wakeM] = entry.wakeTime.split(':').map(Number);
          let hours = wakeH - bedH;
          if (hours < 0) hours += 24;
          return hours;
        })() : null
      };
    });

    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Relatório para o médico</h2>

        {/* Timeline Filter */}
        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <label className="block text-sm text-slate-400 mb-2">Período de análise</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'Todos os dias' },
              { value: '7', label: 'Últimos 7 dias' },
              { value: '30', label: 'Últimos 30 dias' },
              { value: '90', label: 'Últimos 90 dias' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setReportTimeline(opt.value)}
                className={`px-3 py-2 rounded-lg text-sm ${reportTimeline === opt.value
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">{filteredDates.length} dias no período selecionado</p>
        </div>

        {filteredDates.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg mb-2">Sem dados no período selecionado</p>
            <p>Selecione outro período ou registe mais dias</p>
          </div>
        ) : (
          <>
            {/* Correlation Chart: Blefarospasmo vs Distonia Oromandibular */}
            <div className="bg-slate-800 rounded-xl p-5 mb-4">
              <h3 className="font-semibold text-slate-100 mb-2">Correlação Temporal: Blefarospasmo vs Distonia Oromandibular</h3>
              <p className="text-sm text-slate-400 mb-4">Análise de covariância entre sintomas oculares e mandibulares. Curvas paralelas indicam correlação positiva.</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} stroke="#94a3b8" tick={{ fontSize: 12 }} label={{ value: 'Severidade (0-10)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="olhos" name="Blefarospasmo" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="face" name="Distonia Oromandibular" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="choro" name="Episódios de Choro" stroke="#ec4899" strokeWidth={1} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Functional Impact: Oromandibular Dystonia */}
            <div className="bg-slate-800 rounded-xl p-5 mb-4">
              <h3 className="font-semibold text-slate-100 mb-2">Impacto Funcional da Distonia Oromandibular</h3>
              <p className="text-sm text-slate-400 mb-4">Correlação entre severidade da distonia e funções oromotoras (fala, mastigação/deglutição)</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} stroke="#94a3b8" tick={{ fontSize: 12 }} label={{ value: 'Severidade', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      formatter={(value, name) => {
                        if (name.includes('Disartria') || name.includes('Disfagia')) {
                          const labels = { 0: 'Normal', 3: 'Dificuldade leve', 7: 'Dificuldade moderada', 10: 'Incapacidade' };
                          return [labels[value] || value, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="face" name="Distonia Oromandibular" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="fala" name="Disartria (fala)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="comer" name="Disfagia (comer)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Circadian Pattern */}
            <div className="bg-slate-800 rounded-xl p-5 mb-4">
              <h3 className="font-semibold text-slate-100 mb-2">Padrão Circadiano da Distonia</h3>
              <p className="text-sm text-slate-400 mb-4">Variação da severidade ao longo do dia. Padrão crescente sugere fadiga neuromuscular.</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} stroke="#94a3b8" tick={{ fontSize: 12 }} label={{ value: 'Severidade', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="face" name="Manhã (pós-acordar)" stroke="#fbbf24" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="faceTarde" name="Tarde (12h-18h)" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="faceNoite" name="Noite (após 18h)" stroke="#dc2626" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Botulinum Toxin Efficacy Decay Curve */}
            {botoxRecords.length > 0 && timeSeriesData.some(d => d.daysSinceBtx !== null) && (
              <div className="bg-slate-800 rounded-xl p-5 mb-4">
                <h3 className="font-semibold text-slate-100 mb-2">Curva de Eficácia da Toxina Botulínica</h3>
                <p className="text-sm text-slate-400 mb-4">Severidade dos sintomas em função do tempo pós-injecção. Identifica o período de eficácia terapêutica.</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData.filter(d => d.daysSinceBtx !== null)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="daysSinceBtx" stroke="#94a3b8" tick={{ fontSize: 10 }} label={{ value: 'Dias pós-injecção', position: 'bottom', fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis domain={[0, 10]} stroke="#94a3b8" tick={{ fontSize: 12 }} label={{ value: 'Severidade', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        labelFormatter={(label) => `Dia ${label} pós-injecção`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="olhos" name="Blefarospasmo" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="face" name="Distonia Oromandibular" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Sleep-Dystonia Correlation */}
            {timeSeriesData.some(d => d.sono !== null) && (
              <div className="bg-slate-800 rounded-xl p-5 mb-4">
                <h3 className="font-semibold text-slate-100 mb-2">Correlação Sono-Distonia</h3>
                <p className="text-sm text-slate-400 mb-4">Relação entre duração do sono e severidade dos sintomas. Privação de sono pode exacerbar distonia.</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="symptoms" domain={[0, 10]} stroke="#94a3b8" tick={{ fontSize: 12 }} label={{ value: 'Severidade', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis yAxisId="sleep" orientation="right" domain={[0, 12]} stroke="#22c55e" tick={{ fontSize: 12 }} label={{ value: 'Horas', angle: 90, position: 'insideRight', fill: '#22c55e', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                      <Legend />
                      <Line yAxisId="symptoms" type="monotone" dataKey="face" name="Distonia Oromandibular" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
                      <Line yAxisId="symptoms" type="monotone" dataKey="olhos" name="Blefarospasmo" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2 }} />
                      <Line yAxisId="sleep" type="monotone" dataKey="sono" name="Duração do Sono (h)" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="bg-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-slate-100 mb-4">Últimos registos ({filteredDates.length} dias)</h3>
              {filteredDates.slice(-7).reverse().map(date => {
                const entry = entries[date];
                return (
                  <div key={date} className="border-b border-slate-700 py-4 last:border-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-200">{formatDatePT(date)}</span>
                      <span className="text-sm text-slate-400">Sono: {entry.bedTime || '-'} - {entry.wakeTime || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-slate-400">Acordar: <span className="text-slate-200">O:{entry.wakeEyes} M:{entry.wakeFace}</span></div>
                      <div className="text-slate-400">Manhã: <span className="text-slate-200">O:{entry.morningEyes} M:{entry.morningFace}</span></div>
                      <div className="text-slate-400">Tarde: <span className="text-slate-200">O:{entry.afternoonEyes} M:{entry.afternoonFace}</span></div>
                    </div>
                    {entry.notes && <p className="mt-2 text-sm text-slate-500 italic">"{entry.notes}"</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💊</div>
          <p className="text-slate-400">A carregar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-100">
              Meige Tracker
            </h1>
            {daysSinceBotox() !== null && (
              <div className="text-sm bg-slate-700 text-sky-400 px-3 py-1 rounded-full">
                BTX: {formatDaysAsMonths(daysSinceBotox())}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-14 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { id: 'calendar', label: 'Calendário' },
              { id: 'botox', label: 'Botox' },
              { id: 'consultas', label: 'Consultas' },
              { id: 'report', label: 'Relatório' },
              { id: 'settings', label: 'Medicação' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'settings') {
                    setShowMedicationSetup(true);
                    setCurrentView('calendar');
                  } else {
                    setCurrentView(tab.id);
                    setShowMedicationSetup(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${(currentView === tab.id || (tab.id === 'settings' && showMedicationSetup))
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {showMedicationSetup ? renderMedicationSetup() :
          currentView === 'calendar' ? renderCalendar() :
            currentView === 'entry' ? renderEntryForm() :
              currentView === 'botox' ? renderBotoxSection() :
                currentView === 'consultas' ? renderConsultas() :
                  currentView === 'report' ? renderReport() : null}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-600">
        Meige Tracker - Acompanhamento da Síndroma de Meige
      </footer>
    </div>
  );
};

export default MeigeTracker;
