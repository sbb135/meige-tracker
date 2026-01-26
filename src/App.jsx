import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const MeigeTracker = () => {
  const [currentView, setCurrentView] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMedicationSetup, setShowMedicationSetup] = useState(false);
  const [showBotoxForm, setShowBotoxForm] = useState(false);
  const [showConsultaForm, setShowConsultaForm] = useState(false);
  
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
    { id: 1, name: 'Rivotril', dosePerPill: '0,5', unit: 'mg', times: { 
      pequeno_almoco: { qty: 1, hour: '08:00', timing: 'depois' }, 
      lanche: { qty: 1.5, hour: '16:00', timing: 'depois' }, 
      deitar: { qty: 3, hour: '22:30', timing: 'antes' } 
    }},
    { id: 2, name: 'Artane', dosePerPill: '2', unit: 'mg', times: { 
      pequeno_almoco: { qty: 1, hour: '08:00', timing: 'depois' }, 
      lanche: { qty: 1, hour: '16:00', timing: 'depois' } 
    }},
    { id: 3, name: 'Metibasol', dosePerPill: '5', unit: 'mg', times: { 
      almoco: { qty: 1, hour: '13:00', timing: 'depois' } 
    }},
    { id: 4, name: 'Gotas antidepressivas', dosePerPill: '', unit: 'gotas', times: { 
      deitar: { qty: 10, hour: '22:00', timing: 'antes' } 
    }},
  ]);
  
  const [entries, setEntries] = useState({});
  const [botoxRecords, setBotoxRecords] = useState([]);
  
  // Locais de injecção de Botox para Meige
  const botoxSites = [
    { id: 'orbicular_sup_esq', name: 'Pálpebra superior esquerda', group: 'Olhos' },
    { id: 'orbicular_sup_dir', name: 'Pálpebra superior direita', group: 'Olhos' },
    { id: 'orbicular_inf_esq', name: 'Pálpebra inferior esquerda', group: 'Olhos' },
    { id: 'orbicular_inf_dir', name: 'Pálpebra inferior direita', group: 'Olhos' },
    { id: 'sobrancelha_esq', name: 'Sobrancelha esquerda', group: 'Olhos' },
    { id: 'sobrancelha_dir', name: 'Sobrancelha direita', group: 'Olhos' },
    { id: 'masseter_esq', name: 'Masseter esquerdo', group: 'Face' },
    { id: 'masseter_dir', name: 'Masseter direito', group: 'Face' },
    { id: 'temporal_esq', name: 'Temporal esquerdo', group: 'Face' },
    { id: 'temporal_dir', name: 'Temporal direito', group: 'Face' },
    { id: 'pterigoideu', name: 'Pterigoideu', group: 'Face' },
    { id: 'orbicular_boca', name: 'Orbicular da boca', group: 'Face' },
    { id: 'mento', name: 'Mento (queixo)', group: 'Face' },
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

  // Carregar dados do dia
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
  }, [selectedDate, medications]);

  // Guardar entrada
  const saveEntry = () => {
    setEntries(prev => ({
      ...prev,
      [selectedDate]: dayEntry
    }));
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

  // Dias desde último Botox
  const daysSinceBotox = () => {
    if (botoxRecords.length === 0) return null;
    const sorted = [...botoxRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastBotox = new Date(sorted[0].date);
    const today = new Date();
    return Math.floor((today - lastBotox) / (1000 * 60 * 60 * 24));
  };

  // Guardar Botox
  const saveBotoxRecord = () => {
    setBotoxRecords(prev => [...prev, { ...newBotox, id: Date.now() }]);
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

  // Guardar consulta
  const saveConsulta = () => {
    setConsultas(prev => [...prev, { ...newConsulta, id: Date.now() }]);
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
            <p className="text-slate-400 text-sm">Dias desde última injecção de Botox</p>
            <p className="text-3xl font-bold text-sky-400 mt-1">{daysSinceBotox()}</p>
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
        <span className={`text-lg font-bold ${
          value <= 2 ? 'text-sky-400' : value <= 5 ? 'text-slate-300' : 'text-slate-100'
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
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              value === opt.value 
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
              <input
                type="time"
                value={dayEntry.bedTime}
                onChange={(e) => setDayEntry({...dayEntry, bedTime: e.target.value})}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Hora de acordar</label>
              <input
                type="time"
                value={dayEntry.wakeTime}
                onChange={(e) => setDayEntry({...dayEntry, wakeTime: e.target.value})}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:ring-2 focus:ring-sky-500"
              />
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
                  onClick={() => setDayEntry({...dayEntry, sleepInterruptions: n})}
                  className={`w-10 h-10 rounded-lg ${
                    dayEntry.sleepInterruptions === n 
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
            onChange={(v) => setDayEntry({...dayEntry, sleepQuality: v})}
            options={[
              { value: 'adormeceu_facil', label: 'Adormeceu fácil' },
              { value: 'demorou', label: 'Demorou a adormecer' },
              { value: 'muito_dificil', label: 'Muito difícil adormecer' },
            ]}
          />

          <SelectField
            label="Acordou descansada?"
            value={dayEntry.feltRested}
            onChange={(v) => setDayEntry({...dayEntry, feltRested: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, wakeEyes: v})}
            description="0 = Sem espasmos | 10 = Olhos fecham involuntariamente"
          />

          <SymptomSlider
            label="Face e mandíbula"
            value={dayEntry.wakeFace}
            onChange={(v) => setDayEntry({...dayEntry, wakeFace: v})}
            description="0 = Sem tensão | 10 = Movimentos involuntários fortes"
          />

          <SelectField
            label="Estado emocional ao acordar"
            value={dayEntry.wakeEmotion}
            onChange={(v) => setDayEntry({...dayEntry, wakeEmotion: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, wakeCrying: v})}
          />

          <SelectField
            label="Quanto tempo até estabilizar?"
            value={dayEntry.wakeStabilizeTime}
            onChange={(v) => setDayEntry({...dayEntry, wakeStabilizeTime: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, morningEyes: v})}
          />

          <SymptomSlider
            label="Face e mandíbula"
            value={dayEntry.morningFace}
            onChange={(v) => setDayEntry({...dayEntry, morningFace: v})}
          />

          <SelectField
            label="Fala"
            value={dayEntry.morningSpeech}
            onChange={(v) => setDayEntry({...dayEntry, morningSpeech: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, morningEating: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, afternoonEyes: v})}
          />

          <SymptomSlider
            label="Face e mandíbula"
            value={dayEntry.afternoonFace}
            onChange={(v) => setDayEntry({...dayEntry, afternoonFace: v})}
          />

          <SelectField
            label="Fala"
            value={dayEntry.afternoonSpeech}
            onChange={(v) => setDayEntry({...dayEntry, afternoonSpeech: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, afternoonEating: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, eveningEyes: v})}
          />

          <SymptomSlider
            label="Face e mandíbula"
            value={dayEntry.eveningFace}
            onChange={(v) => setDayEntry({...dayEntry, eveningFace: v})}
          />

          <SelectField
            label="Fala"
            value={dayEntry.eveningSpeech}
            onChange={(v) => setDayEntry({...dayEntry, eveningSpeech: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, eveningEating: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, hadGoodPeriod: v})}
          />

          {dayEntry.hadGoodPeriod && (
            <>
              <SelectField
                label="Quando foi?"
                value={dayEntry.goodPeriodWhen}
                onChange={(v) => setDayEntry({...dayEntry, goodPeriodWhen: v})}
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
                onChange={(v) => setDayEntry({...dayEntry, goodPeriodDuration: v})}
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
                {Object.entries(med.times).map(([time, config]) => (
                  <div key={time} className="bg-slate-600 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300 capitalize">{time}</span>
                      <button
                        onClick={() => {
                          const newMeds = {...dayEntry.medicationsTaken};
                          if (!newMeds[med.id]) newMeds[med.id] = {};
                          if (!newMeds[med.id][time]) newMeds[med.id][time] = { qty: config.qty, hour: config.hour, taken: true };
                          newMeds[med.id][time].taken = !newMeds[med.id][time].taken;
                          setDayEntry({...dayEntry, medicationsTaken: newMeds});
                        }}
                        className={`px-3 py-1 rounded text-sm ${
                          dayEntry.medicationsTaken?.[med.id]?.[time]?.taken !== false
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-500 text-slate-300'
                        }`}
                      >
                        {dayEntry.medicationsTaken?.[med.id]?.[time]?.taken !== false ? 'Tomou' : 'Não tomou'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-slate-400 mb-1">Hora</label>
                        <input
                          type="time"
                          value={dayEntry.medicationsTaken?.[med.id]?.[time]?.hour ?? config.hour}
                          onChange={(e) => {
                            const newMeds = {...dayEntry.medicationsTaken};
                            if (!newMeds[med.id]) newMeds[med.id] = {};
                            if (!newMeds[med.id][time]) newMeds[med.id][time] = { qty: config.qty, hour: config.hour, taken: true };
                            newMeds[med.id][time].hour = e.target.value;
                            setDayEntry({...dayEntry, medicationsTaken: newMeds});
                          }}
                          className="w-full p-2 rounded bg-slate-700 border border-slate-500 text-slate-100 text-sm"
                        />
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
                            const newMeds = {...dayEntry.medicationsTaken};
                            if (!newMeds[med.id]) newMeds[med.id] = {};
                            if (!newMeds[med.id][time]) newMeds[med.id][time] = { qty: config.qty, hour: config.hour, taken: true };
                            newMeds[med.id][time].qty = parseFloat(e.target.value) || 0;
                            setDayEntry({...dayEntry, medicationsTaken: newMeds});
                          }}
                          className="w-full p-2 rounded bg-slate-700 border border-slate-500 text-slate-100 text-sm text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4">
            <label className="block text-sm text-slate-400 mb-1">Notas sobre medicação</label>
            <textarea
              value={dayEntry.medicationNotes}
              onChange={(e) => setDayEntry({...dayEntry, medicationNotes: e.target.value})}
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
                  className={`px-3 py-2 rounded-lg text-sm ${
                    dayEntry.sideEffects[effect.key]
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
                className={`px-4 py-2 rounded-lg text-sm ${
                  dayEntry.triggers[trigger.key]
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
                triggers: {...dayEntry.triggers, other: e.target.value}
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
            onChange={(v) => setDayEntry({...dayEntry, sadnessNoReason: v})}
          />

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Episódios de choro</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setDayEntry({...dayEntry, cryingEpisodes: n})}
                  className={`w-10 h-10 rounded-lg ${
                    dayEntry.cryingEpisodes === n 
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
            onChange={(v) => setDayEntry({...dayEntry, irritability: v})}
          />

          <SelectField
            label="Nível de ansiedade"
            value={dayEntry.anxiety}
            onChange={(v) => setDayEntry({...dayEntry, anxiety: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, leftHouse: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, normalTasks: v})}
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
            onChange={(v) => setDayEntry({...dayEntry, neededHelp: v})}
          />
        </section>

        {/* BOTOX */}
        {botoxRecords.length > 0 && (
          <section className="bg-slate-800 rounded-xl p-5 mb-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 pb-2 border-b border-slate-700">
              Efeito do Botox
            </h3>
            
            <div className="bg-slate-700 rounded-lg p-3 mb-4 text-center">
              <span className="text-slate-400">Dias desde última injecção: </span>
              <span className="font-bold text-sky-400">{daysSinceBotox()}</span>
            </div>

            <SelectField
              label="Sente que o efeito está a diminuir?"
              value={dayEntry.botoxEffect}
              onChange={(v) => setDayEntry({...dayEntry, botoxEffect: v})}
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
            onChange={(e) => setDayEntry({...dayEntry, notes: e.target.value})}
            className="w-full p-4 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
            rows={4}
            placeholder="Qualquer observação importante para o médico..."
          />
        </section>

        {/* GUARDAR */}
        <button
          onClick={saveEntry}
          className="w-full py-4 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-500 transition-all"
        >
          Guardar registo
        </button>
      </div>
    );
  };

  // Configuração de medicamentos
  const renderMedicationSetup = () => {
    const timeLabels = ['manhã', 'almoço', 'tarde', 'noite'];
    
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
                          <div className="flex-1">
                            <input
                              type="time"
                              value={med.times[time].hour}
                              onChange={(e) => {
                                const newMeds = [...medications];
                                newMeds[idx].times[time].hour = e.target.value;
                                setMedications(newMeds);
                              }}
                              className="w-full p-2 rounded bg-slate-700 border border-slate-500 text-slate-100 text-sm"
                            />
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
          onClick={() => setShowMedicationSetup(false)}
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
              <input type="date" value={newConsulta.date} onChange={(e) => setNewConsulta({...newConsulta, date: e.target.value})} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Tipo</label>
              <select value={newConsulta.tipo} onChange={(e) => setNewConsulta({...newConsulta, tipo: e.target.value})} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100">
                {tiposConsulta.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Médico</label>
              <input type="text" value={newConsulta.medico} onChange={(e) => setNewConsulta({...newConsulta, medico: e.target.value})} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Clínica</label>
              <input type="text" value={newConsulta.clinica} onChange={(e) => setNewConsulta({...newConsulta, clinica: e.target.value})} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Motivo</label>
            <input type="text" value={newConsulta.motivo} onChange={(e) => setNewConsulta({...newConsulta, motivo: e.target.value})} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" placeholder="Revisão, ajuste medicação, dores..." />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Notas</label>
            <textarea value={newConsulta.notas} onChange={(e) => setNewConsulta({...newConsulta, notas: e.target.value})} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" rows={3} />
          </div>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Próxima consulta</label>
            <input type="date" value={newConsulta.proximaConsulta} onChange={(e) => setNewConsulta({...newConsulta, proximaConsulta: e.target.value})} className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100" />
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
                <button onClick={() => setConsultas(consultas.filter(x => x.id !== c.id))} className="text-red-400 text-sm">Remover</button>
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
          <p className="text-slate-400 mb-2">Dias desde a última injecção</p>
          <p className="text-5xl font-bold text-sky-400">{daysSinceBotox()}</p>
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
              onChange={(e) => setNewBotox({...newBotox, date: e.target.value})}
              className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Dose total (unidades)</label>
            <input
              type="text"
              value={newBotox.totalDose}
              onChange={(e) => setNewBotox({...newBotox, totalDose: e.target.value})}
              className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
              placeholder="Ex: 100U"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Locais de injecção</label>
            
            {['Olhos', 'Face'].map(group => (
              <div key={group} className="mb-4">
                <p className="text-xs text-slate-500 uppercase mb-2">{group}</p>
                <div className="space-y-2">
                  {botoxSites.filter(s => s.group === group).map(site => (
                    <div key={site.id} className="flex items-center gap-3 bg-slate-700 rounded-lg p-3">
                      <input
                        type="checkbox"
                        checked={newBotox.sites[site.id]?.selected || false}
                        onChange={(e) => {
                          const newSites = {...newBotox.sites};
                          if (e.target.checked) {
                            newSites[site.id] = { selected: true, dose: '' };
                          } else {
                            delete newSites[site.id];
                          }
                          setNewBotox({...newBotox, sites: newSites});
                        }}
                        className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-sky-500"
                      />
                      <span className="flex-1 text-slate-200 text-sm">{site.name}</span>
                      {newBotox.sites[site.id]?.selected && (
                        <input
                          type="text"
                          value={newBotox.sites[site.id]?.dose || ''}
                          onChange={(e) => {
                            const newSites = {...newBotox.sites};
                            newSites[site.id].dose = e.target.value;
                            setNewBotox({...newBotox, sites: newSites});
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
                onChange={(e) => setNewBotox({...newBotox, doctor: e.target.value})}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Clínica</label>
              <input
                type="text"
                value={newBotox.clinic}
                onChange={(e) => setNewBotox({...newBotox, clinic: e.target.value})}
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Notas</label>
            <textarea
              value={newBotox.notes}
              onChange={(e) => setNewBotox({...newBotox, notes: e.target.value})}
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
                  <button
                    onClick={() => setBotoxRecords(botoxRecords.filter(b => b.id !== record.id))}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remover
                  </button>
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

  // Relatório com gráficos
  const renderReport = () => {
    const chartData = prepareChartData();
    const triggersData = getTriggersData();
    const entryDates = Object.keys(entries).sort().reverse();
    
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-slate-100 mb-6">Relatório para o médico</h2>
        
        {entryDates.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg mb-2">Ainda não há registos</p>
            <p>Comece a registar os dias para ver padrões</p>
          </div>
        ) : (
          <>
            <div className="bg-slate-800 rounded-xl p-5 mb-4">
              <h3 className="font-semibold text-slate-100 mb-4">{entryDates.length} dias registados</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-400">Média olhos</p>
                  <p className="text-2xl font-bold text-slate-100">{(entryDates.reduce((sum, d) => sum + (entries[d].morningEyes || 0), 0) / entryDates.length).toFixed(1)}</p>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-400">Média face</p>
                  <p className="text-2xl font-bold text-slate-100">{(entryDates.reduce((sum, d) => sum + (entries[d].morningFace || 0), 0) / entryDates.length).toFixed(1)}</p>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-400">Dias bons</p>
                  <p className="text-2xl font-bold text-slate-100">{entryDates.filter(d => ((entries[d].morningEyes || 0) + (entries[d].morningFace || 0)) / 2 <= 2).length}</p>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-400">Episódios choro</p>
                  <p className="text-2xl font-bold text-slate-100">{entryDates.reduce((sum, d) => sum + (entries[d].cryingEpisodes || 0), 0)}</p>
                </div>
              </div>
            </div>

            {chartData.length > 1 && (
              <div className="bg-slate-800 rounded-xl p-5 mb-4">
                <h3 className="font-semibold text-slate-100 mb-4">Evolução dos sintomas</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 10]} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="mediaOlhos" name="Olhos" stroke="#0ea5e9" strokeWidth={2} />
                      <Line type="monotone" dataKey="mediaFace" name="Face" stroke="#38bdf8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {chartData.length > 1 && chartData.some(d => d.choro > 0) && (
              <div className="bg-slate-800 rounded-xl p-5 mb-4">
                <h3 className="font-semibold text-slate-100 mb-4">Episódios de choro</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                      <Bar dataKey="choro" name="Episódios" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {triggersData.length > 0 && (
              <div className="bg-slate-800 rounded-xl p-5 mb-4">
                <h3 className="font-semibold text-slate-100 mb-4">Triggers mais frequentes</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={triggersData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                      <Bar dataKey="value" name="Vezes" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-slate-100 mb-4">Últimos registos</h3>
              {entryDates.slice(0, 7).map(date => {
                const entry = entries[date];
                return (
                  <div key={date} className="border-b border-slate-700 py-4 last:border-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-200">{formatDatePT(date)}</span>
                      <span className="text-sm text-slate-400">Sono: {entry.bedTime || '-'} - {entry.wakeTime || '-'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-slate-400">Acordar: <span className="text-slate-200">O:{entry.wakeEyes} F:{entry.wakeFace}</span></div>
                      <div className="text-slate-400">Manhã: <span className="text-slate-200">O:{entry.morningEyes} F:{entry.morningFace}</span></div>
                      <div className="text-slate-400">Tarde: <span className="text-slate-200">O:{entry.afternoonEyes} F:{entry.afternoonFace}</span></div>
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
                BTX: {daysSinceBotox()} dias
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
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  (currentView === tab.id || (tab.id === 'settings' && showMedicationSetup))
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
